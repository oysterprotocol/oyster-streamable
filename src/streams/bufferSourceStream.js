import { Readable } from 'readable-stream'

const BYTES_PER_CHUNK = 1024
const CHUNK_ORDER_ASC = 1
const CHUNK_ORDER_DESC = 2

const DEFAULT_OPTIONS = Object.freeze({
  // Chunk offset to account for metadata
  chunkIdOffset: 1,
  // Options for the stream. OM must be true
  objectMode: true,
  highWaterMark: 64
})

export default class BufferSourceStream extends Readable {
  constructor (buffer, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)

    this.options = opts
    this.buffer = buffer
    this.numChunks = Math.ceil(buffer.length / BYTES_PER_CHUNK)
    // Alternate reads between low and high
    this.readNextHigh = false

    // Low reader  (broker A chunks)
    // Reads from the start of the file to the end
    this.lowIdx = 0
    this.readUpperBound = buffer.length

    // High reader (broker B chunks)
    // Reads from the end of the file to the start
    this.highIdx = this.numChunks - 1
    this.readLowerBound = 0

    this.on('setUpperBound', val => {
      this.readUpperBound = val * BYTES_PER_CHUNK - 1
    })
    this.on('setLowerBound', val => {
      this.readLowerBound = val * BYTES_PER_CHUNK
    })
  }
  _read () {
    let chunk

    do {
      chunk = this._readChunkFromBuffer()
    } while(this.push(chunk))
  }
  _readChunkFromBuffer () {
    let chunk

    // End stream when file is read in
    if(this.lowIdx >= this.numChunks && this.highIdx < 0) {
      return null
    } else if (this.lowIdx === this.numChunks) {
      this.readNextHigh = true
    } else if (this.highIdx < 0) {
      this.readNextHigh = false
    }

    if(this.readNextHigh) {
      chunk = this._readHighChunks()
    } else {
      chunk = this._readLowChunks()
    }

    this.readNextHigh = !this.readNextHigh
    return chunk
  }
  _readLowChunks () {
    const offset = this.lowIdx * BYTES_PER_CHUNK
    const limit = Math.min(offset + BYTES_PER_CHUNK, this.readUpperBound)

    return {
      idx: this.options.chunkIdOffset + this.lowIdx++,
      order: CHUNK_ORDER_ASC,
      data: this.buffer.slice(offset, limit)
    }
  }
  _readHighChunks () {
    const offset = Math.max(this.highIdx * BYTES_PER_CHUNK, this.readLowerBound)
    const limit = Math.min(offset + BYTES_PER_CHUNK, this.buffer.length)

    return {
      idx: this.options.chunkIdOffset + this.highIdx--,
      order: CHUNK_ORDER_DESC,
      data: this.buffer.slice(offset, limit)
    }
  }
}
