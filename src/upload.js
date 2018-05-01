import { EventEmitter } from 'events'
import FileChunkStream from './fileChunkStream'
import EncryptStream from './encryptStream'
import DecryptStream from './decryptStream'
import Forge from 'node-forge'

const DEFAULT_OPTIONS = Object.freeze({
  encryptStream: {
    objectMode: true,
    chunkByteSize: 1000
  }
})

export default class Upload extends EventEmitter {
  constructor (file, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super()

    // Just for testing compatibility
    this.handle = '2db1e246393c478bae9cb182fc4942816933356a7138616c746664367a706573'

    this.file = file
    this.fileChunkStream = new FileChunkStream(file, opts.encryptStream || {})
    this.encryptStream = new EncryptStream(this.handle)
    this.decryptStream = new DecryptStream(this.handle)

    this.fileChunkStream.pipe(this.encryptStream).pipe(this.decryptStream)

    // Debugging
    this.data = []
    this.decryptStream.on('data', data => {
      this.data.push(data)
    })

    this.decryptStream.on('end', event => {
      const byteArr = this.data
      const blob = new Blob(byteArr, {type: 'application/octet-stream'})
      this.emit('debugfile', blob)
      console.log('upload finished', event)
    })
  }
}
