import { Transform } from 'readable-stream'
import { bytesFromHandle, encryptBytes } from './util'

const DEFAULT_OPTIONS = Object.freeze({
    objectMode: true,
    chunkByteSize: 1000
  })

export default class EncryptStream extends Transform {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)

    this.handle = handle
    this.options = opts
    this.key = bytesFromHandle(handle)
  }
  _transform (data, encoding, callback) {
    const buffer = data.buffer
    const chunkByteSize = this.options.chunkByteSize
    const length = buffer.byteLength
    const handle = this.handle
    const key = this.key

    for(let offset = 0; offset < length; offset += chunkByteSize) {
      const limit = Math.min(length - offset, chunkByteSize)
      const bytes = new Uint8Array(buffer, offset, limit)
      const encryptedBytes = encryptBytes(key, bytes)

      this.push(encryptedBytes)
    }

    callback()
  }
}
