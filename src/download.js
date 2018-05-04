import IOTA from 'iota.lib.js'
import { EventEmitter } from 'events'
import DecryptStream from './decryptStream'
import DownloadStream from './downloadStream'
import FilePreviewStream from './filePreviewStream'

import { genesisHash } from './utils/encryption'
import { createUploadSession } from './utils/backend'
import { createMetaData } from './utils/file-processor'
import { IOTA_API } from "./config";
import * as Util from './util'

const iotaA = new IOTA({ provider: IOTA_API.PROVIDER_A })
const iotaB = new IOTA({ provider: IOTA_API.PROVIDER_B })
const DEFAULT_OPTIONS = Object.freeze({
})

export default class Download extends EventEmitter {
  constructor (handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super()
    this.startDownload = this.startDownload.bind(this)

    this.options = opts
    this.handle = handle
    this.genesisHash = genesisHash(handle)
    this.key = Util.bytesFromHandle(handle)

    this.getMetadata().then(this.startDownload).catch(error => {
      console.info('Error', error)
    })
  }
  getMetadata () {
    return Util.queryGeneratedSignatures(iotaA, this.genesisHash, 1).then(data => {
      const trytes = Util.parseMessage(data[0])
      const metadata = JSON.parse(Util.decryptString(this.key, trytes))
      this.emit('metadata', metadata)
      this.metadata = metadata
      return Promise.resolve(metadata)
    })
  }
  startDownload (metadata) {
    this.downloadStream = new DownloadStream(this.genesisHash, metadata, {iota: iotaA})
    this.decryptStream = new DecryptStream(this.key)
    // this could be anything in the future, but for now grab the whole file
    this.filePreviewStream = new FilePreviewStream(metadata)

    this.downloadStream
      .pipe(this.decryptStream)
      .pipe(this.filePreviewStream)
      .on('finish', () => {
        this.emit('finish', {
          target: this,
          metadata: this.metadata,
          file: this.filePreviewStream.file
        })
      })
  }
}
