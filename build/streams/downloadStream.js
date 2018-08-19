"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _readableStream = require("readable-stream");

var _util = require("../util");

var _backend = require("../utils/backend");

var _config = require("../config");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_OPTIONS = Object.freeze({
  maxParallelDownloads: 4,
  chunksPerBatch: 500,
  binaryMode: false,
  // WIP. Must be passed for now
  iota: null,
  objectMode: true
});

function notNull(item) {
  return item !== null;
}

var DownloadStream = function (_Readable) {
  _inherits(DownloadStream, _Readable);

  function DownloadStream(genesisHash, metadata, options) {
    _classCallCheck(this, DownloadStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (DownloadStream.__proto__ || Object.getPrototypeOf(DownloadStream)).call(this, opts));

    _this.options = opts;
    _this.numChunks = metadata.numberOfChunks;
    _this.downloadedChunks = 0;
    _this.hash = (0, _util.offsetHash)(genesisHash, 0);
    _this.chunkOffset = 0;
    _this.chunkBuffer = [];
    _this.isDownloadFinished = false;
    _this.processBatchId = 0;
    _this.batchId = 0;
    _this.batches = {};
    _this.pushChunk = false;
    _this.ongoingDownloads = 0;

    if (_config.INCLUDE_TREASURE_OFFSETS) {
      _this.numChunks += Math.ceil(_this.numChunks / (_config.FILE.CHUNKS_PER_SECTOR - 1));
    }

    _this._download();
    return _this;
  }

  _createClass(DownloadStream, [{
    key: "_read",
    value: function _read() {
      this.pushChunk = true;

      var attemptDownload = this.ongoingDownloads < this.options.maxParallelDownloads;
      if (!this.isDownloadFinished && attemptDownload) {
        this._download();
      }

      this._pushChunk();
    }
  }, {
    key: "_pushChunk",
    value: function _pushChunk() {
      if (!this.pushChunk) {
        return;
      }

      if (this.chunkBuffer.length === 0) {
        // Try for next batch
        if (this.batches.hasOwnProperty(this.processBatchId)) {
          this.chunkBuffer = this.batches[this.processBatchId];
          delete this.batches[this.processBatchId];
          this.processBatchId++;
          // Done, end stream
        } else if (this.isDownloadFinished) {
          this.push(null);
          // Wait
        } else {
          return;
        }
      }

      if (this.chunkBuffer.length) {
        var chunk = this.chunkBuffer.shift();
        this.pushChunk = this.push(chunk);
        this._pushChunk();
      }
    }
  }, {
    key: "_download",
    value: function _download() {
      var _this2 = this;

      var hash = this.hash;
      var limit = Math.min(this.numChunks - this.chunkOffset, this.options.chunksPerBatch);

      if (limit === 0) {
        return;
      }

      this.ongoingDownloads++;
      this.hash = (0, _util.offsetHash)(hash, limit - 1);
      this.chunkOffset += limit;

      var batchId = this.batchId++;
      var iotaProvider = this.options.iotaProvider;
      var binaryMode = this.options.binaryMode;

      (0, _backend.queryGeneratedSignatures)(iotaProvider, hash, limit, binaryMode).then(function (result) {
        _this2.ongoingDownloads--;

        // Process result
        if (result.isBinary) {
          _this2._processBinaryChunk(result.data, batchId);
        } else {
          var signatures = result.data.filter(notNull);
          if (signatures && signatures.length === limit) {
            _this2.batches[batchId] = signatures;
            _this2.downloadedChunks += signatures.length;
          } else {
            _this2.emit("error", "Download incomplete");
          }
        }

        // Check if finished
        if (_this2.numChunks - _this2.chunkOffset <= 0 && _this2.ongoingDownloads === 0) {
          _this2.isDownloadFinished = true;
        }

        _this2.emit("progress", 100 * _this2.downloadedChunks / _this2.numChunks);
        _this2._pushChunk();
      }).catch(function (error) {
        _this2.ongoingDownloads--;
        _this2.emit("error", error);
      }).catch(function (error) {});
    }
  }, {
    key: "_processBinaryChunk",
    value: function _processBinaryChunk(buffer, batchId) {
      var batch = [];
      var bytes = new Uint8Array(buffer);
      var maxOffset = bytes.length - 2;

      var i = 0;
      var offset = 0;
      var length = void 0;
      var chunk = void 0;
      while (offset < maxOffset) {
        length = bytes[offset] << 8 | bytes[offset + 1];
        chunk = new Uint8Array(buffer, offset + 2, length);
        offset += 2 + length;
        batch.push(chunk);
      }

      this.batches[batchId] = batch;
      this.downloadedChunks += batch.length;
    }
  }]);

  return DownloadStream;
}(_readableStream.Readable);

exports.default = DownloadStream;