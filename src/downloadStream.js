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
  }
  _read () {
    const bufferLength = this.chunkBuffer.length
    // Avoid read chain-reaction. Not nice. Better solution?
    const pushChunk = bufferLength === 0

    // One download at a time for now
    if (!this.isDownloading && !this.isDownloadFinished) {
      this._download(pushChunk)
    }

    if(bufferLength) {
      this.push(this.chunkBuffer.shift())
    } else if(this.isDownloadFinished) {
      this.push(null)
    }
  }
  _download (pushChunk) {
    const hash = this.hash
    const limit = Math.min(
                    this.numChunks - this.chunkOffset,
                    this.options.chunksPerBatch)

    this.isDownloading = true

    if(limit === 0) {
      this.isDownloadFinished = true

      if(pushChunk) {
        this.push(null)
      }

      return
    }

    this.chunkOffset += limit
    this.hash = Util.offsetHash(hash, limit)

    Util.queryGeneratedSignatures(this.options.iota, hash, limit).then(data => {
      this.isDownloading = false
      if(data && data.length === limit) {
        this.chunkBuffer = this.chunkBuffer.concat(data)

        if(pushChunk) {
          this.push(this.chunkBuffer.shift())
        }
      } else {
        this.emit('error', 'Download incomplete')
      }
    }).catch(error => {
      this.emit('error', error)
    })
  }
}
