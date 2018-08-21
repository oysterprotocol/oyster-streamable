"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EVENTS = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require("events");

var _decryptStream = require("./streams/decryptStream");

var _decryptStream2 = _interopRequireDefault(_decryptStream);

var _downloadStream = require("./streams/downloadStream");

var _downloadStream2 = _interopRequireDefault(_downloadStream);

var _filePreviewStream = require("./streams/filePreviewStream");

var _filePreviewStream2 = _interopRequireDefault(_filePreviewStream);

var _bufferTargetStream = require("./streams/bufferTargetStream");

var _bufferTargetStream2 = _interopRequireDefault(_bufferTargetStream);

var _datamapGenerator = require("datamap-generator");

var _datamapGenerator2 = _interopRequireDefault(_datamapGenerator);

var _iota = require("./utils/iota");

var _backend = require("./utils/backend");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_OPTIONS = Object.freeze({});
var REQUIRED_OPTS = ["iotaProviders"];

var EVENTS = exports.EVENTS = Object.freeze({
  DOWNLOAD_PROGRESS: "download-progress",
  FINISH: "finish"
});

var Download = function (_EventEmitter) {
  _inherits(Download, _EventEmitter);

  function Download(handle, options) {
    _classCallCheck(this, Download);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    (0, _util.validateKeys)(opts, REQUIRED_OPTS);

    var _this = _possibleConstructorReturn(this, (Download.__proto__ || Object.getPrototypeOf(Download)).call(this));

    _this.startDownload = _this.startDownload.bind(_this);
    _this.propagateError = _this.propagateError.bind(_this);

    _this.options = opts;
    _this.handle = handle;
    _this.genesisHash = _datamapGenerator2.default.genesisHash(handle);
    _this.key = (0, _util.bytesFromHandle)(handle);

    (0, _iota.getMetadata)(handle, opts.iotaProviders).then(function (_ref) {
      var metadata = _ref.metadata,
          provider = _ref.provider;

      _this.iotaProvider = provider;
      _this.metadata = metadata;
      _this.emit('metadata', metadata);

      _this.startDownload(metadata);
    }).catch(_this.propagateError);
    return _this;
  }

  _createClass(Download, [{
    key: "startDownload",
    value: function startDownload(metadata) {
      var _this2 = this;

      var _options = this.options,
          targetStream = _options.targetStream,
          targetOptions = _options.targetOptions;


      this.downloadStream = new _downloadStream2.default(this.genesisHash, metadata, {
        iotaProvider: this.iotaProvider
      });
      this.decryptStream = new _decryptStream2.default(this.key);
      this.targetStream = new targetStream(metadata, targetOptions || {});

      this.downloadStream.pipe(this.decryptStream).pipe(this.targetStream).on("finish", function () {
        _this2.emit(EVENTS.FINISH, {
          target: _this2,
          metadata: _this2.metadata,
          result: _this2.targetStream.result
        });
      });

      this.downloadStream.on("progress", function (progress) {
        _this2.emit(EVENTS.DOWNLOAD_PROGRESS, { progress: progress });
      });

      this.downloadStream.on("error", this.propagateError);
      this.decryptStream.on("error", this.propagateError);
      this.targetStream.on("error", this.propagateError);
    }
  }, {
    key: "propagateError",
    value: function propagateError(error) {
      this.emit("error", error);
    }
  }], [{
    key: "toBuffer",
    value: function toBuffer(handle) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var target = { targetStream: _bufferTargetStream2.default };
      var opts = Object.assign(options, target);

      return new Download(handle, opts);
    }
  }, {
    key: "toBlob",
    value: function toBlob(handle) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var target = { targetStream: _filePreviewStream2.default };
      var opts = Object.assign(options, target);

      return new Download(handle, opts);
    }
  }]);

  return Download;
}(_events.EventEmitter);

exports.default = Download;