import { Transform } from 'readable-stream'
import { bytesFromHandle, decryptBytes } from './util'

const DEFAULT_OPTIONS = Object.freeze({
    objectMode: true
  })

export default class DecryptStream extends Transform {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)

    this.options = opts
    this.key = bytesFromHandle(handle)
  }
  _transform (trytes, encoding, callback) {
    const decrypted = decryptBytes(this.key, trytes)
    callback(null, decrypted)
  }
}
