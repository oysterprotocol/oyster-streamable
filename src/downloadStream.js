import { Readable } from 'readable-stream'
import { queryGeneratedSignatures } from './utils/backend'
import { offsetHash } from './util'

const DEFAULT_OPTIONS = Object.freeze({
    maxParallelDownloads: 4,
    chunksPerBatch: 500,
    // WIP. Must be passed for now
    iota: null,
    objectMode: false
  })

function notNull (item) {
  return item !== null
}

export default class DownloadStream extends Readable {
  constructor (genesisHash, metadata, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
    this.numChunks = metadata.numberOfChunks
    this.hash = offsetHash(genesisHash, 0)
    this.chunkOffset = 0
    this.chunkBuffer = []
    this.isDownloadFinished = false
    this.processBatchId = 0
    this.batchId = 0
    this.batches = {}
    this.pushChunk = false
    this.ongoingDownloads = 0

    if(this.numChunks === 0) {
      this.push(null)
    } else {
      this._download()
    }
  }
  _read () {
    this.pushChunk = true

    const attemptDownload = this.ongoingDownloads < this.options.maxParallelDownloads
    if (!this.isDownloadFinished && attemptDownload) {
      this._download()
    }

    this._pushChunk()
  }
  _pushChunk () {
    if (!this.pushChunk) {
      return
    }

    if (this.chunkBuffer.length === 0) {
      // Try for next batch
      if(this.batches.hasOwnProperty(this.processBatchId)) {
        this.chunkBuffer = this.batches[this.processBatchId]
        delete this.batches[this.processBatchId]
        this.processBatchId++
      // Done, end stream
      } else if (this.isDownloadFinished) {
        this.push(null)
      // Wait
      } else {
        return
      }
    }

    if (this.chunkBuffer.length) {
      this.pushChunk = this.push(this.chunkBuffer.shift())
      this._pushChunk()
    }
  }
  _download () {
    const hash = this.hash
    const limit = Math.min(
                    this.numChunks - this.chunkOffset,
                    this.options.chunksPerBatch)

    if(limit === 0) {
      return
    }

    this.ongoingDownloads++
    this.hash = offsetHash(hash, limit - 1)
    this.chunkOffset += limit

    const batchId = this.batchId++
    const iota = this.options.iota
    const binaryMode = !this.options.objectMode
    queryGeneratedSignatures(iota, hash, limit, binaryMode).then(result => {
      this.ongoingDownloads--

      // Process result
      if(result.isBinary) {
        this._processBinaryChunk(result.data, batchId)
      } else {
        const signatures = result.data.filter(notNull)
        if(signatures && signatures.length === limit) {
          this.batches[batchId] = signatures
        } else {
          this.emit('error', 'Download incomplete')
        }
      }

      // Check if finished
      if (this.numChunks - this.chunkOffset <= 0 && this.ongoingDownloads === 0) {
        this.isDownloadFinished = true
      }

      this._pushChunk()
    }).catch(error => {
      this.ongoingDownloads--
      this.emit('error', error)
    })
  }
  _processBinaryChunk (buffer, batchId) {
    const batch = []
    const bytes = new Uint8Array(buffer)
    const maxOffset = bytes.length - 2

    let i = 0
    let offset = 0
    let length
    let chunk
    while(offset < maxOffset) {
      length = (bytes[offset] << 8) | bytes[offset+1]
      chunk = new Uint8Array(buffer, offset + 2, length)
      offset += 2 + length
      batch.push(chunk)
    }

    this.batches[batchId] = batch
  }
}
