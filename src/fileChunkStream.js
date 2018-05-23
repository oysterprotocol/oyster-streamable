import { Readable } from 'readable-stream'

const BYTES_PER_CHUNK = 1024
const CHUNK_ORDER_ASC = 1
const CHUNK_ORDER_DESC = 2

const DEFAULT_OPTIONS = Object.freeze({
  // Chunk offset to account for metadata
  chunkIdOffset: 1,
  readSize: BYTES_PER_CHUNK * 16,
  // Options for the stream. OM must be true
  objectMode: true,
  highWaterMark: 64
})

export default class FileChunkStream extends Readable {
  constructor (file, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)

    this.options = opts
    this.file = file
    this.numChunks = Math.ceil(file.size / BYTES_PER_CHUNK)
    // Alternate reads between low and high
    this.reader = new FileReader()
    this.readNextHigh = false
    this.chunkBuffer = []
    this.pushChunk = false

    // Low reader  (broker A chunks)
    // Reads from the start of the file to the end
    this.lowIdx = 0
    this.readUpperBound = file.size

    // High reader (broker B chunks)
    // Reads from the end of the file to the start
    this.highIdx = this.numChunks - 1
    this.readLowerBound = 0

    this._onLowRead = this._onLowRead.bind(this)
    this._onHighRead = this._onHighRead.bind(this)

    this.on('setUpperBound', val => {
      this.readUpperBound = val * BYTES_PER_CHUNK - 1
    })
    this.on('setLowerBound', val => {
      this.readLowerBound = val * BYTES_PER_CHUNK
    })
  }
  _read () {
    this.pushChunk = true
    this._pushChunk()
  }
  _pushChunk () {
    if(!this.pushChunk) {
      return
    }

    if(this.chunkBuffer.length > 0) {
      this.pushChunk = this.push(this.chunkBuffer.shift())
      this._pushChunk()
    } else if (this.reader.readyState !== FileReader.LOADING) {
      this._readChunksFromFile()
    }
  }
  _readChunksFromFile () {
    // End stream when file is read in
    if(this.lowIdx === this.numChunks && this.highIdx < 0) {
      console.log('read finish')
      return this.push(null)
    } else if (this.lowIdx === this.numChunks) {
      console.log('low end finished')
      this.readNextHigh = true
    } else if (this.highIdx < 0) {
      console.log('high end finished')
      this.readNextHigh = false
    }

    if(this.readNextHigh) {
      this._readHighChunks()
    } else {
      this._readLowChunks()
    }

    this.readNextHigh = !this.readNextHigh
  }
  _readLowChunks () {
    const offset = this.lowIdx * BYTES_PER_CHUNK
    const size = this.options.readSize
    const limit = Math.min(offset + size, this.readUpperBound)
    const chunk = this.file.slice(offset, limit, 'application/octet-stream')

    this.reader.onload = this._onLowRead
    this.reader.readAsArrayBuffer(chunk)
  }
  _readHighChunks () {
    const fullLimit = (this.highIdx + 1) * BYTES_PER_CHUNK
    const size = this.options.readSize
    const limit = Math.min(fullLimit, this.file.size)
    const offset = Math.max(fullLimit - size, this.readLowerBound)
    const chunk = this.file.slice(offset, limit, 'application/octet-stream')

    this.reader.onload = this._onHighRead
    this.reader.readAsArrayBuffer(chunk)
  }
  _onLowRead (event) {
    const result = event.target.result
    let i = 0
    let limit = 0
    let offset

    while (limit < result.byteLength) {
      offset = i++ * BYTES_PER_CHUNK
      limit = Math.min(offset + BYTES_PER_CHUNK, result.byteLength)
      const data = new Uint8Array(result, offset, limit - offset)
      this.chunkBuffer.push({
        order: CHUNK_ORDER_ASC,
        idx: this.options.chunkIdOffset + this.lowIdx++,
        data
      })
    }

    this._pushChunk()
  }
  _onHighRead (event) {
    const result = event.target.result
    const chunkCount = Math.ceil(result.byteLength / BYTES_PER_CHUNK)
    let i = 0
    let limit = 0
    let offset

    while (limit < result.byteLength) {
      offset = i++ * BYTES_PER_CHUNK
      limit = Math.min(offset + BYTES_PER_CHUNK, result.byteLength)
      const data = new Uint8Array(result, offset, limit - offset)
      this.chunkBuffer.push({
        order: CHUNK_ORDER_DESC,
        idx: this.options.chunkIdOffset + this.highIdx - chunkCount + i,
        data
      })
    }

    this.highIdx -= chunkCount
    this._pushChunk()
  }
}
