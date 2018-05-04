import { Writable } from 'readable-stream'
import { sendToBrokers } from './utils/backend'

const DEFAULT_OPTIONS = Object.freeze({
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
    this.chunkId = 0
  }
  _write (data, encoding, callback) {
    const id = this.chunkId++

    this.chunkBuffer.push({
      idx: id,
      data: data,
      hash: this.genesisHash
    })

    // TODO: Upload batches
    // Currently not testable

    callback()
  }
  _final (callback) {
    sendToBrokers(this.sessIdA, this.sessIdB, this.chunkBuffer).then(() => {
      callback()
    }).catch(error => {
      callback(error)
    })
  }
}
