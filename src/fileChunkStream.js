import { Readable } from 'readable-stream'

const DEFAULT_OPTIONS = Object.freeze({
  highWaterMark: 1024 * 64,
  readSize: 1024 * 16
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
    this.readSize = this.options.readSize
    this._readChunksFromFile()
  }
  _readChunksFromFile (event) {
    const offset = this.offset
    const file = this.file
    const size = this.readSize
    const limit = Math.min(offset + size, file.size)

    // End stream when file is read in
    if(offset >= file.size) {
      return this.push(null)
    }

    const chunk = file.slice(offset, limit, 'application/octet-stream')

    this.offset = limit
    this.reader.readAsArrayBuffer(chunk)
  }
  _onFileRead (event) {
    const data = new Uint8Array(event.target.result)

    // Keep going until stream queue is full
    // Only useful in paused mode (???)
    if(this.push(data) !== false) {
      if(this.reader.readyState !== FileReader.LOADING) {
        this._readChunksFromFile()
      }
    }
  }
}
