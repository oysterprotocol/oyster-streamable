"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _iotaLib = require("iota.lib.js");

var _iotaLib2 = _interopRequireDefault(_iotaLib);

var _events = require("events");

var _nodeForge = require("node-forge");

var _nodeForge2 = _interopRequireDefault(_nodeForge);

var _decryptStream = require("./streams/decryptStream");

var _decryptStream2 = _interopRequireDefault(_decryptStream);

var _downloadStream = require("./streams/downloadStream");

var _downloadStream2 = _interopRequireDefault(_downloadStream);

var _filePreviewStream = require("./streams/filePreviewStream");

var _filePreviewStream2 = _interopRequireDefault(_filePreviewStream);

var _bufferTargetStream = require("./streams/bufferTargetStream");

var _bufferTargetStream2 = _interopRequireDefault(_bufferTargetStream);

var _encryption = require("./utils/encryption");

var _backend = require("./utils/backend");

var _config = require("./config");

var _util = require("./util");

var Util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var iota = new _iotaLib2.default({ provider: _config.IOTA_API.PROVIDER });
var DEFAULT_OPTIONS = Object.freeze({});

var Download = function (_EventEmitter) {
  _inherits(Download, _EventEmitter);

  function Download(handle, options) {
    _classCallCheck(this, Download);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (Download.__proto__ || Object.getPrototypeOf(Download)).call(this));

    _this.startDownload = _this.startDownload.bind(_this);
    _this.propagateError = _this.propagateError.bind(_this);

    _this.options = opts;
    _this.handle = handle;
    _this.genesisHash = (0, _encryption.genesisHash)(handle);
    _this.key = Util.bytesFromHandle(handle);

    _this.getMetadata().then(_this.startDownload).catch(_this.propagateError);
    return _this;
  }

  _createClass(Download, [{
    key: "getMetadata",
    value: function getMetadata() {
      var _this2 = this;

      return (0, _backend.queryGeneratedSignatures)(iota, this.genesisHash, 1).then(function (result) {
        var signature = result.data[0];

        if (signature === null) {
          throw new Error("File does not exist.");
        }

        var _Util$decryptMetadata = Util.decryptMetadata(_this2.key, signature),
            version = _Util$decryptMetadata.version,
            metadata = _Util$decryptMetadata.metadata;

        _this2.emit("metadata", metadata);
        _this2.metadata = metadata;
        return Promise.resolve(metadata);
      }).catch(function (error) {
        throw error;
      });
    }
  }, {
    key: "startDownload",
    value: function startDownload(metadata) {
      var _this3 = this;

      var _options = this.options,
          targetStream = _options.targetStream,
          targetOptions = _options.targetOptions;


      this.downloadStream = new _downloadStream2.default(this.genesisHash, metadata, {
        iota: iota
      });
      this.decryptStream = new _decryptStream2.default(this.key);
      this.targetStream = new targetStream(metadata, targetOptions || {});

      this.downloadStream.pipe(this.decryptStream).pipe(this.targetStream).on("finish", function () {
        _this3.emit("finish", {
          target: _this3,
          metadata: _this3.metadata,
          result: _this3.targetStream.result
        });
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

      var target = {
        targetStream: _bufferTargetStream2.default
      };

      return new Download(handle, Object.assign(options, target));
    }
  }, {
    key: "toBlob",
    value: function toBlob(handle) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var target = {
        targetStream: _filePreviewStream2.default
      };

      return new Download(handle, Object.assign(options, target));
    }
  }]);

  return Download;
}(_events.EventEmitter);

exports.default = Download;