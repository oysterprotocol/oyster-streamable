"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require("events");

var _datamapGenerator = require("datamap-generator");

var _datamapGenerator2 = _interopRequireDefault(_datamapGenerator);

var _iota = require("./utils/iota");

var _upload = require("./upload");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var REQUIRED_OPTS = ["iotaProvider"];
var DEFAULT_OPTIONS = Object.freeze({});

var UploadProgress = function (_EventEmitter) {
  _inherits(UploadProgress, _EventEmitter);

  function UploadProgress(handle, options) {
    _classCallCheck(this, UploadProgress);

    var _this = _possibleConstructorReturn(this, (UploadProgress.__proto__ || Object.getPrototypeOf(UploadProgress)).call(this));

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    (0, _util.validateKeys)(opts, REQUIRED_OPTS);

    _this.handle = handle;
    _this.options = opts;
    _this.iotaProviders = [opts.iotaProvider];
    _this.chunks = 0;

    (0, _iota.getMetadata)(_this.handle, _this.iotaProviders).then(function (_ref) {
      var metadata = _ref.metadata,
          provider = _ref.provider;

      _this.numberOfChunks = metadata.numberOfChunks;
      _this.iotaProvider = provider;

      _this.pollUploadProgress();
    }).catch(_this.emit("error", error));
    return _this;
  }

  _createClass(UploadProgress, [{
    key: "pollUploadProgress",
    value: function pollUploadProgress() {
      var _this2 = this;

      var genesisHash = _datamapGenerator2.default.genesisHash(this.handle);
      var datamap = _datamapGenerator2.default.generate(genesisHash, this.numberOfChunks - 1);

      (0, _iota.pollIotaProgress)(datamap, this.iotaProvider, function (prog) {
        _this2.emit(_upload.EVENTS.UPLOAD_PROGRESS, { progress: prog });
      }).then(function () {
        _this2.emit(_upload.EVENTS.FINISH, {
          target: _this2,
          handle: _this2.handle,
          numberOfChunks: _this2.numberOfChunks,
          metadata: _this2.metadata
        });
      });
    }
  }], [{
    key: "streamUploadProgress",
    value: function streamUploadProgress(handle, opts) {
      console.log("Check upload progress on :", handle);
      return new UploadProgress(handle, opts);
    }
  }]);

  return UploadProgress;
}(_events.EventEmitter);

exports.default = UploadProgress;