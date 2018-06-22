'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _iotaLib = require('iota.lib.js');

var _iotaLib2 = _interopRequireDefault(_iotaLib);

var _events = require('events');

var _nodeForge = require('node-forge');

var _nodeForge2 = _interopRequireDefault(_nodeForge);

var _decryptStream = require('./streams/decryptStream');

var _decryptStream2 = _interopRequireDefault(_decryptStream);

var _downloadStream = require('./streams/downloadStream');

var _downloadStream2 = _interopRequireDefault(_downloadStream);

var _filePreviewStream = require('./streams/filePreviewStream');

var _filePreviewStream2 = _interopRequireDefault(_filePreviewStream);

var _bufferTargetStream = require('./streams/bufferTargetStream');

var _bufferTargetStream2 = _interopRequireDefault(_bufferTargetStream);

var _encryption = require('./utils/encryption');

var _backend = require('./utils/backend');

var _config = require('./config');

var _util = require('./util');

var Util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const iota = new _iotaLib2.default({ provider: _config.IOTA_API.PROVIDER });
const DEFAULT_OPTIONS = Object.freeze({
  autoStart: true
});

class Download extends _events.EventEmitter {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super();
    this.startDownload = this.startDownload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.options = opts;
    this.handle = handle;
    this.genesisHash = (0, _encryption.genesisHash)(handle);
    this.key = Util.bytesFromHandle(handle);
    this.started = false;

    this.getMetadata().then(() => {
      if (opts.targetStream && opts.autoStart) {
        this.startDownload();
      }
    }).catch(this.propagateError);
  }

  static toBuffer(handle, options = {}) {
    const target = {
      targetStream: _bufferTargetStream2.default
    };

    return new Download(handle, Object.assign(options, target));
  }

  static toBlob(handle, options = {}) {
    const target = {
      targetStream: _filePreviewStream2.default
    };

    return new Download(handle, Object.assign(options, target));
  }

  getMetadata() {
    return (0, _backend.queryGeneratedSignatures)(iota, this.genesisHash, 1).then(result => {
      const signature = result.data[0];

      if (signature === null) {
        throw new Error('File does not exist.');
      }

      const { version, metadata } = Util.decryptMetadata(this.key, signature);
      this.metadata = metadata;
      this.emit('metadata', metadata);
    }).catch(error => {
      throw error;
    });
  }

  startDownload(target) {
    const metadata = this.metadata;
    let { targetStream, targetOptions } = this.options;

    if (this.started) {
      return true;
    }

    this.started = true;
    this.downloadStream = new _downloadStream2.default(this.genesisHash, metadata, { iota });
    this.decryptStream = new _decryptStream2.default(this.key);
    if (target) {
      this.targetStream = target;
    } else {
      this.targetStream = new targetStream(metadata, targetOptions || {});
    }

    this.downloadStream.pipe(this.decryptStream).pipe(this.targetStream).on('finish', () => {
      this.emit('finish', {
        target: this,
        metadata: this.metadata,
        result: this.targetStream.result
      });
    });

    this.downloadStream.on('progress', progress => {
      this.emit('progress.download', progress);
    });

    this.downloadStream.on('error', this.propagateError);
    this.decryptStream.on('error', this.propagateError);
    this.targetStream.on('error', this.propagateError);
  }

  propagateError(error) {
    this.emit('error', error);
  }
}
exports.default = Download;