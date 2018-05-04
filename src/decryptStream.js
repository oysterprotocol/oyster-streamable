import { Transform } from 'readable-stream'
import { bytesFromHandle, decryptBytes, parseMessage } from './util'

const DEFAULT_OPTIONS = Object.freeze({
    objectMode: true
  })

export default class DecryptStream extends Transform {
  constructor (key, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
    this.key = key
  }
  _transform (trytes, encoding, callback) {
    const decrypted = decryptBytes(this.key, parseMessage(trytes))
    callback(null, decrypted)
  }
}
