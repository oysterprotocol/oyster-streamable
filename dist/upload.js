'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _fileChunkStream = require('./streams/fileChunkStream');

var _fileChunkStream2 = _interopRequireDefault(_fileChunkStream);

var _bufferSourceStream = require('./streams/bufferSourceStream');

var _bufferSourceStream2 = _interopRequireDefault(_bufferSourceStream);

var _encryptStream = require('./streams/encryptStream');

var _encryptStream2 = _interopRequireDefault(_encryptStream);

var _uploadStream = require('./streams/uploadStream');

var _uploadStream2 = _interopRequireDefault(_uploadStream);

var _encryption = require('./utils/encryption');

var _backend = require('./utils/backend');

var _fileProcessor = require('./utils/file-processor');

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CHUNK_BYTE_SIZE = 1024;
const DEFAULT_OPTIONS = Object.freeze({
  filename: '',
  epochs: 1,
  encryptStream: {
    chunkByteSize: CHUNK_BYTE_SIZE
  }
});

class Upload extends _events.EventEmitter {
  constructor(filename, size, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    const epochs = opts.epochs;
    const chunkCount = Math.ceil(size / CHUNK_BYTE_SIZE);
    const totalChunks = chunkCount + 1;

    super();
    this.startUpload = this.startUpload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.options = opts;
    this.handle = (0, _encryption.createHandle)(filename);
    this.metadata = (0, _fileProcessor.createMetaData)(filename, chunkCount);
    this.genesisHash = (0, _encryption.genesisHash)(this.handle);
    this.key = (0, _util.bytesFromHandle)(this.handle);
    this.numberOfChunks = totalChunks;

    this.uploadSession = (0, _backend.createUploadSession)(size, this.genesisHash, totalChunks, epochs).then(this.startUpload);
  }

  // File object (browser)
  static fromFile(file, options = {}) {
    const source = {
      sourceData: file,
      sourceStream: _fileChunkStream2.default
    };

    return new Upload(file.name, file.size, Object.assign(options, source));
  }

  // Uint8Array or node buffer
  static fromData(buffer, filename, options = {}) {
    const source = {
      sourceData: buffer,
      sourceStream: _bufferSourceStream2.default
    };

    return new Upload(filename, buffer.length, Object.assign(options, source));
  }

  startUpload(session) {
    const sessIdA = session.alphaSessionId;
    const sessIdB = session.betaSessionId;
    const invoice = session.invoice || null;
    const metadata = (0, _util.encryptMetadata)(this.metadata, this.key);
    const { sourceStream, sourceData, sourceOptions } = this.options;

    this.emit('invoice', invoice);

    this.sourceStream = new sourceStream(sourceData, sourceOptions || {});
    this.encryptStream = new _encryptStream2.default(this.handle);
    this.uploadStream = new _uploadStream2.default(metadata, this.genesisHash, sessIdA, sessIdB);

    this.sourceStream.pipe(this.encryptStream).pipe(this.uploadStream).on('finish', () => {
      this.emit('finish', {
        target: this,
        handle: this.handle,
        numberOfChunks: this.numberOfChunks,
        metadata: this.metadata
      });
    });

    this.sourceStream.on('error', this.propagateError);
    this.encryptStream.on('error', this.propagateError);
    this.uploadStream.on('error', this.propagateError);
  }
  propagateError(error) {
    this.emit('error', error);
  }
}
exports.default = Upload;