import { Transform } from 'readable-stream'
import { bytesFromHandle, encryptBytes, addStopperTryte } from './util'

const DEFAULT_OPTIONS = Object.freeze({
    objectMode: true,
    chunkByteSize: 1024
  })

export default class EncryptStream extends Transform {
  constructor (handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
    this.key = bytesFromHandle(handle)
  }
  _transform (data, encoding, callback) {
    const key = this.key
    const chunkByteSize = this.options.chunkByteSize
    const buffer = data.buffer
    const length = buffer.byteLength

    // TODO: Buffer remainders instead of creating small chunks
    // Currently avoided by reading the file in multiples of chunkByteSize
    for(let offset = 0; offset < length; offset += chunkByteSize) {
      const limit = Math.min(length - offset, chunkByteSize)
      const bytes = new Uint8Array(buffer, offset, limit)
      const encryptedBytes = addStopperTryte(encryptBytes(key, bytes))
      this.push(encryptedBytes)
    }

    callback()
  }
}
