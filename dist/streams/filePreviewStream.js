'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readableStream = require('readable-stream');

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_OPTIONS = Object.freeze({});

class FilePreviewStream extends _readableStream.Writable {
  constructor(metadata, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.metadata = metadata;
    this.fileChunks = [];
    this.file = null;
  }
  _write(data, encoding, callback) {
    this.fileChunks.push(data);
    callback();
  }
  _final(callback) {
    const type = _mime2.default.getType(this.metadata.ext);
    this.result = new Blob(this.fileChunks, { type });
    callback();
  }
}
exports.default = FilePreviewStream;