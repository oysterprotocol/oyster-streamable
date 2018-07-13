var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { Writable } from "readable-stream";
import { sendToBroker } from "../utils/backend";

var CHUNK_ORDER_ASC = 1;
var CHUNK_ORDER_DESC = 2;

var DEFAULT_OPTIONS = Object.freeze({
  batchSize: 2000,
  maxParallelUploads: 2,
  maxRetries: 10,
  objectMode: true
});

var UploadStream = function (_Writable) {
  _inherits(UploadStream, _Writable);

  function UploadStream(metadataTrytes, genesisHash, numChunks, alpha, beta, sessIdA, sessIdB, options) {
    _classCallCheck(this, UploadStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    var metachunk = { idx: 0, data: metadataTrytes, hash: genesisHash };

    var _this = _possibleConstructorReturn(this, (UploadStream.__proto__ || Object.getPrototypeOf(UploadStream)).call(this, opts));

    _this.options = opts;
    _this.genesisHash = genesisHash;
    _this.numChunks = numChunks;
    _this.alpha = alpha;
    _this.beta = beta;
    _this.sessIdA = sessIdA;
    _this.sessIdB = sessIdB;
    _this.chunkBufferLow = [metachunk];
    _this.chunkBufferHigh = [];
    _this.batchBuffer = [];
    _this.ongoingUploads = 0;
    _this.chunksProcessed = 0;
    _this.retries = 0;
    _this.finishCallback = null;
    return _this;
  }

  _createClass(UploadStream, [{
    key: "_write",
    value: function _write(data, encoding, callback) {
      var chunk = {
        idx: data.idx,
        data: data.data,
        hash: this.genesisHash
      };

      if (data.order === CHUNK_ORDER_ASC) {
        this.chunkBufferLow.push(chunk);
        if (this.chunkBufferLow.length === this.options.batchSize) {
          this.batchBuffer.push({
            chunks: this.chunkBufferLow,
            order: CHUNK_ORDER_ASC
          });
          this.chunkBufferLow = [];
          this._attemptUpload();
        }
      } else {
        this.chunkBufferHigh.push(chunk);
        if (this.chunkBufferHigh.length === this.options.batchSize) {
          this.batchBuffer.push({
            chunks: this.chunkBufferHigh,
            order: CHUNK_ORDER_DESC
          });
          this.chunkBufferHigh = [];
          this._attemptUpload();
        }
      }

      callback();
    }
  }, {
    key: "_final",
    value: function _final(callback) {
      this.finishCallback = callback;

      if (this.chunkBufferLow.length > 0) {
        this.batchBuffer.push({
          chunks: this.chunkBufferLow,
          order: CHUNK_ORDER_ASC
        });
      }

      if (this.chunkBufferHigh.length > 0) {
        this.batchBuffer.push({
          chunks: this.chunkBufferHigh,
          order: CHUNK_ORDER_DESC
        });
      }

      if (this.batchBuffer.length > 0) {
        this._attemptUpload();
      } else if (this.ongoingUploads === 0) {
        callback();
      }
    }
  }, {
    key: "_attemptUpload",
    value: function _attemptUpload() {
      if (this.ongoingUploads >= this.options.maxParallelUploads) {
        return;
      }

      var batch = this.batchBuffer.shift();
      this._upload(batch);
    }
  }, {
    key: "_upload",
    value: function _upload(batch) {
      var _this2 = this;

      this.ongoingUploads++;

      // Cork stream when busy
      if (this.ongoingUploads === this.options.maxParallelUploads) {
        this.cork();
      }

      var upload = void 0;
      if (batch.order === CHUNK_ORDER_ASC) {
        upload = sendToBroker(this.alpha, this.sessIdA, batch.chunks);
      } else {
        upload = sendToBroker(this.beta, this.sessIdB, batch.chunks);
      }

      upload.then(function (result) {
        _this2._afterUpload();
      }).catch(function (error) {
        _this2._uploadError(error, batch);
      });
    }
  }, {
    key: "_afterUpload",
    value: function _afterUpload() {
      var _this3 = this;

      this.ongoingUploads--;
      this.chunksProcessed++;

      // Upload until done
      if (this.batchBuffer.length > 0) {
        return this._attemptUpload();
      }

      if (this.finishCallback) {
        // Finish
        if (this.ongoingUploads === 0) {
          this.finishCallback();
        }
      } else {
        // Continue
        process.nextTick(function () {
          return _this3.uncork();
        });
      }
    }
  }, {
    key: "_uploadError",
    value: function _uploadError(error, batch) {
      this.ongoingUploads--;

      console.warn("error", error);

      if (this.retries++ < this.options.maxRetries) {
        console.log("retrying", this.retries, "of", this.options.maxRetries);
        this.batchBuffer.push(batch);
        this._attemptUpload();
        return;
      }

      if (this.finishCallback) {
        this.finishCallback(error);
      } else {
        this.emit("error", error);
        this.close();
      }
    }
  }]);

  return UploadStream;
}(Writable);

export default UploadStream;