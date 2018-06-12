import Forge from 'node-forge'
import { Transform } from 'readable-stream'
import { iota, bytesFromHandle, decryptBytes, parseMessage } from '../util'

const ByteBuffer = Forge.util.ByteBuffer
const DEFAULT_OPTIONS = Object.freeze({
    binaryMode: false,
    objectMode: true
  })

export default class DecryptStream extends Transform {
  constructor (key, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
    this.key = key
  }
  _transform (chunk, encoding, callback) {
    let byteBuffer

    if(this.options.binaryMode) {
      byteBuffer = new ByteBuffer(chunk, 'raw')
    } else {
      const trytes = parseMessage(chunk)
      const bytes = iota.utils.fromTrytes(trytes)

      // odd tryte count. assume treasure and continue
      if (!bytes) {
        return callback()
      }
      byteBuffer = new ByteBuffer(bytes, 'binary')
    }

    const decrypted = decryptBytes(this.key, byteBuffer)
    if (decrypted) {
      callback(null, decrypted)
    } else {
      // could not decrypt. assume treasure and continue
      callback()
    }
  }
}
