import { Readable } from 'readable-stream'

const DEFAULT_OPTIONS = Object.freeze({
  highWaterMark: 65536,
})

export default class FileChunkStream extends Readable {
  constructor(file, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
    this.file = file
    this.reader = new FileReader()
    this.offset = 0

    this.reader.onload = this._onFileRead.bind(this)
  }
  _read (size) {
    this.readSize = size
    this._readChunksFromFile()
  }
  _readChunksFromFile (event) {
    const offset = this.offset
    const file = this.file
    const size = this.readSize

    // End stream when file is read in
    if(offset >= file.size) {
      return this.push(null)
    }

    const limit = Math.min(offset + size, file.size)
    const chunk = file.slice(offset, limit, 'application/octet-stream')

    this.offset = limit
    this.reader.readAsArrayBuffer(chunk)
  }
  _onFileRead (event) {
    const data = new Uint8Array(event.target.result)

    // Keep going until stream queue is full
    if(this.push(data) !== false) {
      this._readChunksFromFile()
    }
  }
}
