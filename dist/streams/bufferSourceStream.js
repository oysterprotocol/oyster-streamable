'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _readableStream = require('readable-stream');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BYTES_PER_CHUNK = 1024;
var CHUNK_ORDER_ASC = 1;
var CHUNK_ORDER_DESC = 2;

var DEFAULT_OPTIONS = Object.freeze({
  // Chunk offset to account for metadata
  chunkIdOffset: 1,
  // Options for the stream. OM must be true
  objectMode: true,
  highWaterMark: 64
});

var BufferSourceStream = function (_Readable) {
  _inherits(BufferSourceStream, _Readable);

  function BufferSourceStream(buffer, options) {
    _classCallCheck(this, BufferSourceStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (BufferSourceStream.__proto__ || Object.getPrototypeOf(BufferSourceStream)).call(this, opts));

    _this.options = opts;
    _this.buffer = buffer;
    _this.numChunks = Math.ceil(buffer.length / BYTES_PER_CHUNK);
    // Alternate reads between low and high
    _this.readNextHigh = false;

    // Low reader  (broker A chunks)
    // Reads from the start of the file to the end
    _this.lowIdx = 0;
    _this.readUpperBound = buffer.length;

    // High reader (broker B chunks)
    // Reads from the end of the file to the start
    _this.highIdx = _this.numChunks - 1;
    _this.readLowerBound = 0;

    _this.on('setUpperBound', function (val) {
      _this.readUpperBound = val * BYTES_PER_CHUNK - 1;
    });
    _this.on('setLowerBound', function (val) {
      _this.readLowerBound = val * BYTES_PER_CHUNK;
    });
    return _this;
  }

  _createClass(BufferSourceStream, [{
    key: '_read',
    value: function _read() {
      var chunk = void 0;

      do {
        chunk = this._readChunkFromBuffer();
      } while (this.push(chunk));
    }
  }, {
    key: '_readChunkFromBuffer',
    value: function _readChunkFromBuffer() {
      var chunk = void 0;

      // End stream when file is read in
      if (this.lowIdx >= this.numChunks && this.highIdx < 0) {
        return null;
      } else if (this.lowIdx === this.numChunks) {
        this.readNextHigh = true;
      } else if (this.highIdx < 0) {
        this.readNextHigh = false;
      }

      if (this.readNextHigh) {
        chunk = this._readHighChunks();
      } else {
        chunk = this._readLowChunks();
      }

      this.readNextHigh = !this.readNextHigh;
      return chunk;
    }
  }, {
    key: '_readLowChunks',
    value: function _readLowChunks() {
      var offset = this.lowIdx * BYTES_PER_CHUNK;
      var limit = Math.min(offset + BYTES_PER_CHUNK, this.readUpperBound);

      return {
        idx: this.options.chunkIdOffset + this.lowIdx++,
        order: CHUNK_ORDER_ASC,
        data: this.buffer.slice(offset, limit)
      };
    }
  }, {
    key: '_readHighChunks',
    value: function _readHighChunks() {
      var offset = Math.max(this.highIdx * BYTES_PER_CHUNK, this.readLowerBound);
      var limit = Math.min(offset + BYTES_PER_CHUNK, this.buffer.length);

      return {
        idx: this.options.chunkIdOffset + this.highIdx--,
        order: CHUNK_ORDER_DESC,
        data: this.buffer.slice(offset, limit)
      };
    }
  }]);

  return BufferSourceStream;
}(_readableStream.Readable);

exports.default = BufferSourceStream;