import { Writable } from 'readable-stream'

const DEFAULT_OPTIONS = Object.freeze({})

export default class EncryptStream extends Writable {
  constructor(file, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super(opts)
    this.options = opts
  }
}
