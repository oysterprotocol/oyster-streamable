import { Readable } from 'readable-stream'
import * as Util from './util'

const DEFAULT_OPTIONS = Object.freeze({
    chunksPerBatch: 50,
    // WIP. Must be passed for now
    iota: null,
    objectMode: true
  })

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

    Util.queryGeneratedSignatures(this.options.iota, hash, limit).then(data => {
      this.isDownloading = false
      if(data && data.length === limit) {
        this.chunkBuffer = this.chunkBuffer.concat(data)
        this._pushChunk()
      } else {
        this.emit('error', 'Download incomplete')
      }
    }).catch(error => {
      this.emit('error', error)
    })
  }
}
