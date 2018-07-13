var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import IOTA from "iota.lib.js";
import { EventEmitter } from "events";
import Forge from "node-forge";
import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
import FilePreviewStream from "./streams/filePreviewStream";
import BufferTargetStream from "./streams/bufferTargetStream";

import { genesisHash } from "./utils/encryption";
import { queryGeneratedSignatures } from "./utils/backend";
import { IOTA_API } from "./config";
import * as Util from "./util";

var iota = new IOTA({ provider: IOTA_API.PROVIDER });
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
    _this.genesisHash = genesisHash(handle);
    _this.key = Util.bytesFromHandle(handle);

    _this.getMetadata().then(_this.startDownload).catch(_this.propagateError);
    return _this;
  }

  _createClass(Download, [{
    key: "getMetadata",
    value: function getMetadata() {
      var _this2 = this;

      return queryGeneratedSignatures(iota, this.genesisHash, 1).then(function (result) {
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


      this.downloadStream = new DownloadStream(this.genesisHash, metadata, {
        iota: iota
      });
      this.decryptStream = new DecryptStream(this.key);
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
        targetStream: BufferTargetStream
      };

      return new Download(handle, Object.assign(options, target));
    }
  }, {
    key: "toBlob",
    value: function toBlob(handle) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var target = {
        targetStream: FilePreviewStream
      };

      return new Download(handle, Object.assign(options, target));
    }
  }]);

  return Download;
}(EventEmitter);

export default Download;