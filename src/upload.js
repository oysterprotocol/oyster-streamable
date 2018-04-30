import { EventEmitter } from 'events'
import FileChunkStream from './fileChunkStream'

const DEFAULT_OPTIONS = Object.freeze({
  chunk: 10
})

export default class Upload extends EventEmitter {
  constructor (file, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)

    super()

    console.log('upload: file upload', file, options)

    this.file = file
    this.fileChunkStream = new FileChunkStream(file, opts.fileChunkStream || {})

    this.fileChunkStream.on('data', data => {
      console.log('upload: file chunk', data)
    })

    this.fileChunkStream.on('end', event => {
      console.log('upload: consumed', event)
    })
  }
}
