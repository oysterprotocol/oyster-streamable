import { EventEmitter } from 'events'
import FileChunkStream from './fileChunkStream'
import EncryptStream from './encryptStream'
import UploadStream from './uploadStream'

import { createHandle, genesisHash } from './utils/encryption'
import { createUploadSession } from './utils/backend'
import { createMetaData } from './utils/file-processor'
import { bytesFromHandle, encryptString } from './util'

const CHUNK_BYTE_SIZE = 1000
const DEFAULT_OPTIONS = Object.freeze({
  epochs: 999,
  encryptStream: {
    chunkByteSize: CHUNK_BYTE_SIZE
  }
})

export default class Upload extends EventEmitter {
  constructor (file, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)
    const epochs = opts.epochs
    const chunkCount = Math.ceil(file.size / CHUNK_BYTE_SIZE)
    const totalChunks = chunkCount + 1

    super()
    this.startUpload = this.startUpload.bind(this)

    this.options = opts
    this.file = file
    this.handle = createHandle(file.name)
    this.metadata = createMetaData(file.name, chunkCount)
    this.genesisHash = genesisHash(this.handle)
    this.key = bytesFromHandle(this.handle)

    this.uploadSession = createUploadSession(file.size, this.genesisHash, totalChunks, epochs)
      .then(this.startUpload)

  }
  startUpload (session) {
    const sessIdA = session.alphaSessionId
    const sessIdB = session.betaSessionId
    const invoice = session.invoice || false
    const metaChunk = encryptString(this.key, this.metadata)

    this.emit('invoice', invoice)

    this.fileChunkStream = new FileChunkStream(this.file, this.options.encryptStream || {})
    this.encryptStream = new EncryptStream(this.handle)
    this.uploadStream = new UploadStream(this.genesisHash, sessIdA, sessIdB)

    // TODO: Length check metachunk?
    this.uploadStream.write(metaChunk)

    this.fileChunkStream
      .pipe(this.encryptStream)
      .pipe(this.uploadStream)
      .on('finish', (event) => {
        this.emit('finish', {
          target: this,
          handle: this.hande,
          metadata: this.metadata
        })
      })
  }
}
