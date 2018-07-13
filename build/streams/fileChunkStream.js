var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { Readable } from "readable-stream";

var BYTES_PER_CHUNK = 1024;
var CHUNK_ORDER_ASC = 1;
var CHUNK_ORDER_DESC = 2;

var DEFAULT_OPTIONS = Object.freeze({
  // Chunk offset to account for metadata
  chunkIdOffset: 1,
  readSize: BYTES_PER_CHUNK * 16,
  // Options for the stream. OM must be true
  objectMode: true,
  highWaterMark: 64
});

var FileChunkStream = function (_Readable) {
  _inherits(FileChunkStream, _Readable);

  function FileChunkStream(file, options) {
    _classCallCheck(this, FileChunkStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (FileChunkStream.__proto__ || Object.getPrototypeOf(FileChunkStream)).call(this, opts));

    _this.options = opts;
    _this.file = file;
    _this.numChunks = Math.ceil(file.size / BYTES_PER_CHUNK);
    // Alternate reads between low and high
    _this.reader = new FileReader();
    _this.readNextHigh = false;
    _this.chunkBuffer = [];
    _this.pushChunk = false;

    // Low reader  (broker A chunks)
    // Reads from the start of the file to the end
    _this.lowIdx = 0;
    _this.readUpperBound = file.size;

    // High reader (broker B chunks)
    // Reads from the end of the file to the start
    _this.highIdx = _this.numChunks - 1;
    _this.readLowerBound = 0;

    _this._onLowRead = _this._onLowRead.bind(_this);
    _this._onHighRead = _this._onHighRead.bind(_this);

    _this.on("setUpperBound", function (val) {
      _this.readUpperBound = val * BYTES_PER_CHUNK - 1;
    });
    _this.on("setLowerBound", function (val) {
      _this.readLowerBound = val * BYTES_PER_CHUNK;
    });
    return _this;
  }

  _createClass(FileChunkStream, [{
    key: "_read",
    value: function _read() {
      this.pushChunk = true;
      this._pushChunk();
    }
  }, {
    key: "_pushChunk",
    value: function _pushChunk() {
      if (!this.pushChunk) {
        return;
      }

      if (this.chunkBuffer.length > 0) {
        this.pushChunk = this.push(this.chunkBuffer.shift());
        this._pushChunk();
      } else if (this.reader.readyState !== FileReader.LOADING) {
        this._readChunksFromFile();
      }
    }
  }, {
    key: "_readChunksFromFile",
    value: function _readChunksFromFile() {
      // End stream when file is read in
      if (this.lowIdx === this.numChunks && this.highIdx < 0) {
        return this.push(null);
      } else if (this.lowIdx === this.numChunks) {
        this.readNextHigh = true;
      } else if (this.highIdx < 0) {
        this.readNextHigh = false;
      }

      if (this.readNextHigh) {
        this._readHighChunks();
      } else {
        this._readLowChunks();
      }

      this.readNextHigh = !this.readNextHigh;
    }
  }, {
    key: "_readLowChunks",
    value: function _readLowChunks() {
      var offset = this.lowIdx * BYTES_PER_CHUNK;
      var size = this.options.readSize;
      var limit = Math.min(offset + size, this.readUpperBound);
      var chunk = this.file.slice(offset, limit, "application/octet-stream");

      this.reader.onload = this._onLowRead;
      this.reader.readAsArrayBuffer(chunk);
    }
  }, {
    key: "_readHighChunks",
    value: function _readHighChunks() {
      var fullLimit = (this.highIdx + 1) * BYTES_PER_CHUNK;
      var size = this.options.readSize;
      var limit = Math.min(fullLimit, this.file.size);
      var offset = Math.max(fullLimit - size, this.readLowerBound);
      var chunk = this.file.slice(offset, limit, "application/octet-stream");

      this.reader.onload = this._onHighRead;
      this.reader.readAsArrayBuffer(chunk);
    }
  }, {
    key: "_onLowRead",
    value: function _onLowRead(event) {
      var result = event.target.result;
      var chunkCount = Math.ceil(result.byteLength / BYTES_PER_CHUNK);
      var i = 0;
      var limit = void 0;
      var offset = void 0;
      var data = void 0;
      var idx = void 0;

      while (i < chunkCount) {
        offset = i++ * BYTES_PER_CHUNK;
        limit = Math.min(offset + BYTES_PER_CHUNK, result.byteLength);
        data = new Uint8Array(result, offset, limit - offset);
        this.chunkBuffer.push({
          order: CHUNK_ORDER_ASC,
          idx: this.options.chunkIdOffset + this.lowIdx++,
          data: data
        });
      }

      this._pushChunk();
    }
  }, {
    key: "_onHighRead",
    value: function _onHighRead(event) {
      var result = event.target.result;
      var chunkCount = Math.ceil(result.byteLength / BYTES_PER_CHUNK);
      var i = chunkCount;
      var limit = void 0;
      var offset = void 0;
      var data = void 0;
      var idx = void 0;

      while (i > 0) {
        offset = --i * BYTES_PER_CHUNK;
        limit = Math.min(offset + BYTES_PER_CHUNK, result.byteLength);
        data = new Uint8Array(result, offset, limit - offset);
        idx = this.options.chunkIdOffset + this.highIdx--;
        this.chunkBuffer.push({
          order: CHUNK_ORDER_DESC,
          idx: idx,
          data: data
        });
      }

      this._pushChunk();
    }
  }]);

  return FileChunkStream;
}(Readable);

export default FileChunkStream;