import Forge from 'node-forge'
import { Transform } from 'readable-stream'
import { iota, bytesFromHandle, decryptBytes, parseMessage } from './util'

const ByteBuffer = Forge.util.ByteBuffer
const DEFAULT_OPTIONS = Object.freeze({
    objectMode: false
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

    if(!this.objectMode) {
      byteBuffer = new ByteBuffer(chunk, 'raw')
    } else {
      const trytes = parseMessage(chunk)
      const bytes = iota.utils.fromTrytes(trytes)
      byteBuffer = new ByteBuffer(bytes, 'binary')
    }

    const decrypted = decryptBytes(this.key, byteBuffer)
    callback(null, decrypted)
  }
}
