"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EVENTS = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require("events");

var _datamapGenerator = require("datamap-generator");

var _datamapGenerator2 = _interopRequireDefault(_datamapGenerator);

var _fileChunkStream = require("./streams/fileChunkStream");

var _fileChunkStream2 = _interopRequireDefault(_fileChunkStream);

var _bufferSourceStream = require("./streams/bufferSourceStream");

var _bufferSourceStream2 = _interopRequireDefault(_bufferSourceStream);

var _encryptStream = require("./streams/encryptStream");

var _encryptStream2 = _interopRequireDefault(_encryptStream);

var _uploadStream = require("./streams/uploadStream");

var _uploadStream2 = _interopRequireDefault(_uploadStream);

var _util = require("./util");

var _encryption = require("./utils/encryption");

var _backend = require("./utils/backend");

var _fileProcessor = require("./utils/file-processor");

var _iota = require("./utils/iota");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CHUNK_BYTE_SIZE = 1024;
var DEFAULT_OPTIONS = Object.freeze({
  filename: "",
  encryptStream: { chunkByteSize: CHUNK_BYTE_SIZE }
});

var REQUIRED_OPTS = ["alpha", "beta", "epochs", "iotaProvider"];

var EVENTS = exports.EVENTS = Object.freeze({
  INVOICE: "invoice",
  PAYMENT_PENDING: "payment-pending",
  PAYMENT_CONFIRMED: "payment-confirmed",
  // Maybe change this to "uploaded", with upload-progress renamed attach-progress or something
  RETRIEVED: "retrieved",
  UPLOAD_PROGRESS: "upload-progress",
  FINISH: "finish",
  ERROR: "error"
});

// TODO: Figure out which ivars are actually needed vs. just locally scoped.
// Then convert all ivars to local consts

var Upload = function (_EventEmitter) {
  _inherits(Upload, _EventEmitter);

  function Upload(filename, size, options) {
    _classCallCheck(this, Upload);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    (0, _util.validateKeys)(opts, REQUIRED_OPTS);

    var chunkCount = Math.ceil(size / CHUNK_BYTE_SIZE);
    var totalChunks = chunkCount + 1;

    var _this = _possibleConstructorReturn(this, (Upload.__proto__ || Object.getPrototypeOf(Upload)).call(this));

    _this.startUpload = _this.startUpload.bind(_this);
    _this.propagateError = _this.propagateError.bind(_this);

    _this.alpha = opts.alpha;
    _this.beta = opts.beta;
    _this.epochs = opts.epochs;
    _this.iotaProviders = [opts.iotaProvider];
    _this.options = opts;
    _this.filename = filename;
    _this.handle = (0, _encryption.createHandle)(filename);
    _this.metadata = (0, _fileProcessor.createMetaData)(filename, chunkCount);
    _this.genesisHash = (0, _encryption.genesisHash)(_this.handle);
    _this.key = (0, _util.bytesFromHandle)(_this.handle);
    _this.numberOfChunks = totalChunks;

    // hack to stub brokers for testing.
    var createUploadSessionFn = _this.options.createUploadSession || _backend.createUploadSession;

    _this.uploadSession = createUploadSessionFn(size, _this.genesisHash, totalChunks, _this.alpha, _this.beta, _this.epochs).then(_this.startUpload.bind(_this)).catch(_this.propagateError.bind(_this));
    return _this;
  }

  // File object (browser)


  _createClass(Upload, [{
    key: "startUpload",
    value: function startUpload(session) {
      var _this2 = this;

      if (!!this.options.testEnv) {
        // TODO: Actually implement these.
        // Stubbing for now to work on integration.

        this.emit(EVENTS.INVOICE, session.invoice);
        this.emit(EVENTS.PAYMENT_PENDING);

        // This is currently what the client expects, not sure if this
        // payload makes sense to be emitted here...
        // TODO: Better stubs and mocks.
        this.emit(EVENTS.PAYMENT_CONFIRMED, {
          filename: this.filename,
          handle: this.handle,
          numberOfChunks: this.numberOfChunks
        });

        this.emit(EVENTS.UPLOAD_PROGRESS, { progress: 0.123 });

        this.emit(EVENTS.FINISH);
        return;
      }

      var sessIdA = session.alphaSessionId;
      var sessIdB = session.betaSessionId;
      var invoice = session.invoice || null;
      var host = this.alpha;
      var metadata = (0, _util.encryptMetadata)(this.metadata, this.key);
      var _options = this.options,
          sourceStream = _options.sourceStream,
          sourceData = _options.sourceData,
          sourceOptions = _options.sourceOptions;


      this.emit(EVENTS.INVOICE, invoice);

      // Wait for payment.
      (0, _backend.confirmPendingPoll)(host, sessIdA).then(function () {
        _this2.emit(EVENTS.PAYMENT_PENDING);
        return (0, _backend.confirmPaidPoll)(host, sessIdA);
      }).then(function () {
        _this2.emit(EVENTS.PAYMENT_CONFIRMED, {
          filename: _this2.filename,
          handle: _this2.handle,
          numberOfChunks: _this2.numberOfChunks
        });

        _this2.sourceStream = new sourceStream(sourceData, sourceOptions || {});
        _this2.encryptStream = new _encryptStream2.default(_this2.handle);
        _this2.uploadStream = new _uploadStream2.default(metadata, _this2.genesisHash, _this2.metadata.numberOfChunks, _this2.alpha, _this2.beta, sessIdA, sessIdB);

        _this2.sourceStream.pipe(_this2.encryptStream).pipe(_this2.uploadStream).on("finish", function () {
          (0, _iota.pollMetadata)(_this2.handle, _this2.iotaProviders).then(function () {
            _this2.emit(EVENTS.RETRIEVED, {
              target: _this2,
              handle: _this2.handle,
              numberOfChunks: _this2.numberOfChunks,
              metadata: _this2.metadata
            });

            _this2.pollUploadProgress(_this2.handle);
          });
        });

        _this2.sourceStream.on("error", _this2.propagateError);
        _this2.encryptStream.on("error", _this2.propagateError);
        _this2.uploadStream.on("error", _this2.propagateError);
      }).catch(this.propagateError.bind(this));
    }
  }, {
    key: "propagateError",
    value: function propagateError(error) {
      this.emit(EVENTS.ERROR, error);
    }
  }, {
    key: "pollUploadProgress",
    value: function pollUploadProgress(handle) {
      var _this3 = this;

      var genHash = _datamapGenerator2.default.genesisHash(handle);
      var datamap = _datamapGenerator2.default.generate(genHash, this.numberOfChunks - 1);

      (0, _iota.pollIotaProgress)(datamap, this.iotaProviders, function (prog) {
        _this3.emit(EVENTS.UPLOAD_PROGRESS, { progress: prog });
      }).then(function () {
        _this3.emit(EVENTS.FINISH, {
          target: _this3,
          handle: _this3.handle,
          numberOfChunks: _this3.numberOfChunks,
          metadata: _this3.metadata
        });
      });
    }
  }], [{
    key: "fromFile",
    value: function fromFile(file) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var source = { sourceData: file, sourceStream: _fileChunkStream2.default };
      var opts = Object.assign(options, source);

      return new Upload(file.name, file.size, opts);
    }

    // Uint8Array or node buffer

  }, {
    key: "fromData",
    value: function fromData(buffer, filename) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      var source = { sourceData: buffer, sourceStream: _bufferSourceStream2.default };
      var opts = Object.assign(options, source);

      return new Upload(filename, buffer.length, opts);
    }
  }]);

  return Upload;
}(_events.EventEmitter);

exports.default = Upload;