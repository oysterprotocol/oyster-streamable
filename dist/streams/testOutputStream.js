'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readableStream = require('readable-stream');

const CHUNK_ORDER_ASC = 1;
const CHUNK_ORDER_DESC = 2;

const DEFAULT_OPTIONS = Object.freeze({
  objectMode: true
});

class TestOutputStream extends _readableStream.Writable {
  constructor(options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
  }
  _write(data, encoding, callback) {
    console.log('output', data);

    callback();
  }
}
exports.default = TestOutputStream;