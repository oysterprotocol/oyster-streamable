import { Writable } from 'readable-stream'
import { sendToBrokers } from './utils/backend'

const DEFAULT_OPTIONS = Object.freeze({
    batchSize: 50,
    maxParallelUploads: 2,
    maxRetries: 10,
    objectMode: true
  })

export default class UploadStream extends Writable {
  constructor (genesisHash, sessIdA, sessIdB, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
    this.genesisHash = genesisHash
    this.sessIdA = sessIdA
    this.sessIdB = sessIdB
    this.chunkBuffer = []
    this.batchBuffer = []
    this.chunkId = 0
    this.ongoingUploads = 0
    this.retries = 0
    this.finishCallback = null
  }
  _write (data, encoding, callback) {
    const id = this.chunkId++

    this.chunkBuffer.push({
      idx: id,
      data: data,
      hash: this.genesisHash
    })

    if(this.chunkBuffer.length === this.options.batchSize) {
      this.batchBuffer.push(this.chunkBuffer)
      this.chunkBuffer = []
      this._attemptUpload()
    }

    callback()
  }
  _final (callback) {
    this.finishCallback = callback

    if(this.chunkBuffer.length > 0) {
      this.batchBuffer.push(this.chunkBuffer)
      this._attemptUpload()
    } else if(this.ongoingUploads === 0) {
      callback()
    }
  }
  _attemptUpload () {
    if(this.ongoingUploads >= this.options.maxParallelUploads) {
      return
    }

    const chunks = this.batchBuffer.shift()
    this._upload(chunks)
  }
  _upload (chunks) {
    this.ongoingUploads++

    // Cork stream when busy
    if(this.ongoingUploads === this.options.maxParallelUploads) {
      this.cork()
    }

    const upload = sendToBrokers(this.sessIdA, this.sessIdB, chunks)

    upload.then((result) => {
      this._afterUpload()
    }).catch(error => {
      this._uploadError(error, chunks)
    })
  }
  _afterUpload () {
    this.ongoingUploads--

    // Upload until done
    if(this.batchBuffer.length > 0) {
      return this._attemptUpload()
    }

    if(this.finishCallback) {
      // Finish
      if(this.ongoingUploads === 0) {
        this.finishCallback()
      }
    } else {
      // Continue
      process.nextTick(() => this.uncork())
    }
  }
  _uploadError (error, chunks) {
    this.ongoingUploads--

    console.warn('error', error)

    if(this.retries++ < this.options.maxRetries) {
      console.log('retrying', this.retries, 'of', this.options.maxRetries)
      this.batchBuffer.push(chunks)
      this._attemptUpload()
      return
    }

    if(this.finishCallback) {
      this.finishCallback(error)
    } else {
      this.emit('error', error)
      this.close()
    }
  }
}
