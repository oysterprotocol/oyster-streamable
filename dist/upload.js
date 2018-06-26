"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require("events");

var _fileChunkStream = require("./streams/fileChunkStream");

var _fileChunkStream2 = _interopRequireDefault(_fileChunkStream);

var _bufferSourceStream = require("./streams/bufferSourceStream");

var _bufferSourceStream2 = _interopRequireDefault(_bufferSourceStream);

var _encryptStream = require("./streams/encryptStream");

var _encryptStream2 = _interopRequireDefault(_encryptStream);

var _uploadStream = require("./streams/uploadStream");

var _uploadStream2 = _interopRequireDefault(_uploadStream);

var _encryption = require("./utils/encryption");

var _backend = require("./utils/backend");

var _fileProcessor = require("./utils/file-processor");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CHUNK_BYTE_SIZE = 1024;
var DEFAULT_OPTIONS = Object.freeze({
  filename: "",
  epochs: 1,
  encryptStream: { chunkByteSize: CHUNK_BYTE_SIZE }
});

var EVENTS = Object.freeze({
  INVOICE: "invoice",
  FINISH: "finish",
  ERROR: "error"
});

var Upload = function (_EventEmitter) {
  _inherits(Upload, _EventEmitter);

  function Upload(filename, size, options) {
    _classCallCheck(this, Upload);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    var epochs = opts.epochs;
    var chunkCount = Math.ceil(size / CHUNK_BYTE_SIZE);
    var totalChunks = chunkCount + 1;

    var _this = _possibleConstructorReturn(this, (Upload.__proto__ || Object.getPrototypeOf(Upload)).call(this));

    _this.startUpload = _this.startUpload.bind(_this);
    _this.propagateError = _this.propagateError.bind(_this);

    _this.options = opts;
    _this.handle = (0, _encryption.createHandle)(filename);
    _this.metadata = (0, _fileProcessor.createMetaData)(filename, chunkCount);
    _this.genesisHash = (0, _encryption.genesisHash)(_this.handle);
    _this.key = (0, _util.bytesFromHandle)(_this.handle);
    _this.numberOfChunks = totalChunks;

    _this.uploadSession = (0, _backend.createUploadSession)(size, _this.genesisHash, totalChunks, epochs).then(_this.startUpload);
    return _this;
  }

  // File object (browser)


  _createClass(Upload, [{
    key: "startUpload",
    value: function startUpload(session) {
      var _this2 = this;

      var sessIdA = session.alphaSessionId;
      var sessIdB = session.betaSessionId;
      var invoice = session.invoice || null;
      var metadata = (0, _util.encryptMetadata)(this.metadata, this.key);
      var _options = this.options,
          sourceStream = _options.sourceStream,
          sourceData = _options.sourceData,
          sourceOptions = _options.sourceOptions;


      this.emit(EVENTS.INVOICE, invoice);

      this.sourceStream = new sourceStream(sourceData, sourceOptions || {});
      this.encryptStream = new _encryptStream2.default(this.handle);
      this.uploadStream = new _uploadStream2.default(metadata, this.genesisHash, sessIdA, sessIdB);

      this.sourceStream.pipe(this.encryptStream).pipe(this.uploadStream).on("finish", function () {
        _this2.emit(EVENTS.FINISH, {
          target: _this2,
          handle: _this2.handle,
          numberOfChunks: _this2.numberOfChunks,
          metadata: _this2.metadata
        });
      });

      this.sourceStream.on("error", this.propagateError);
      this.encryptStream.on("error", this.propagateError);
      this.uploadStream.on("error", this.propagateError);

      return this; // returns self for fluent chainable API.
    }
  }, {
    key: "propagateError",
    value: function propagateError(error) {
      this.emit(EVENTS.ERROR, error);
    }
  }], [{
    key: "fromFile",
    value: function fromFile(file) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var source = { sourceData: file, sourceStream: _fileChunkStream2.default };

      return new Upload(file.name, file.size, Object.assign(options, source));
    }

    // Uint8Array or node buffer

  }, {
    key: "fromData",
    value: function fromData(buffer, filename) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var source = { sourceData: buffer, sourceStream: _bufferSourceStream2.default };

      return new Upload(filename, buffer.length, Object.assign(options, source));
    }
  }]);

  return Upload;
}(_events.EventEmitter);

exports.default = Upload;