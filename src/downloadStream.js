import { Readable } from 'readable-stream'
import * as Util from './util'

const DEFAULT_OPTIONS = Object.freeze({
    chunksPerBatch: 50,
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
    this.hash = Util.offsetHash(genesisHash, 0)
    this.chunkOffset = 0
    this.chunkBuffer = []
    this.isDownloading = false
    this.isDownloadFinished = false
    this.pushChunk = false

    this._download()
  }
  _read () {
    this.pushChunk = true

    if (!this.isDownloading && !this.isDownloadFinished) {
      this._download()
    }

    this._pushChunk()
  }
  _pushChunk () {
    if (!this.pushChunk) {
      return
    }

    if (this.chunkBuffer.length) {
      this.pushChunk = this.push(this.chunkBuffer.shift())
      this._pushChunk()
    } else if(this.isDownloadFinished) {
      this.push(null)
    }
  }
  _download () {
    const hash = this.hash
    const limit = Math.min(
                    this.numChunks - this.chunkOffset,
                    this.options.chunksPerBatch)

    if(limit === 0) {
      this.isDownloadFinished = true
      this._pushChunk()
      return
    }

    this.isDownloading = true
    this.chunkOffset += limit
    this.hash = Util.offsetHash(hash, limit)

    const iota = this.options.iota
    const binaryMode = !this.options.objectMode
    Util.queryGeneratedSignatures(iota, hash, limit, binaryMode).then(result => {
      this.isDownloading = false

      if(result.isBinary) {
        this._processBinaryChunk(result.data)
      } else {
        const signatures = result.data.filter(notNull)
        if(signatures && signatures.length === limit) {
          this.chunkBuffer = this.chunkBuffer.concat(signatures)
        } else {
          this.emit('error', 'Download incomplete')
        }
      }

      this._pushChunk()
    }).catch(error => {
      this.emit('error', error)
    })
  }
  _processBinaryChunk (buffer) {
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
      this.chunkBuffer.push(chunk)
    }
  }
}
