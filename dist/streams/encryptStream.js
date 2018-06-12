'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readableStream = require('readable-stream');

var _util = require('../util');

var _encryption = require('../utils/encryption');

const DEFAULT_OPTIONS = Object.freeze({
  objectMode: true
});

class EncryptStream extends _readableStream.Transform {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.key = (0, _util.bytesFromHandle)(handle);
    this.genesisHash = (0, _encryption.genesisHash)(handle);
  }
  _transform(chunk, encoding, callback) {
    const key = this.key;
    const iv = (0, _encryption.deriveNonce)(this.key, chunk.idx);

    chunk.data = (0, _util.addStopperTryte)((0, _util.encryptBytes)(key, iv, chunk.data));

    callback(null, chunk);
  }
}
exports.default = EncryptStream;