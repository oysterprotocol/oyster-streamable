'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeForge = require('node-forge');

var _nodeForge2 = _interopRequireDefault(_nodeForge);

var _readableStream = require('readable-stream');

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ByteBuffer = _nodeForge2.default.util.ByteBuffer;
const DEFAULT_OPTIONS = Object.freeze({
  binaryMode: false,
  objectMode: true
});

class DecryptStream extends _readableStream.Transform {
  constructor(key, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.key = key;
  }
  _transform(chunk, encoding, callback) {
    let byteBuffer;

    if (this.options.binaryMode) {
      byteBuffer = new ByteBuffer(chunk, 'raw');
    } else {
      const trytes = (0, _util.parseMessage)(chunk);
      const bytes = _util.iota.utils.fromTrytes(trytes);

      // odd tryte count. assume treasure and continue
      if (!bytes) {
        return callback();
      }
      byteBuffer = new ByteBuffer(bytes, 'binary');
    }

    const decrypted = (0, _util.decryptBytes)(this.key, byteBuffer);
    if (decrypted) {
      callback(null, decrypted);
    } else {
      // could not decrypt. assume treasure and continue
      callback();
    }
  }
}
exports.default = DecryptStream;