"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EVENTS = undefined;

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var _events = require("events");

var _datamapGenerator = require("datamap-generator");

var _datamapGenerator2 = _interopRequireDefault(_datamapGenerator);

var _iota = require("./utils/iota");

var _util = require("./util");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return call && (typeof call === "object" || typeof call === "function")
    ? call
    : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError(
      "Super expression must either be null or a function, not " +
        typeof superClass
    );
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
}

var REQUIRED_OPTS = ["iotaProvider"];
var DEFAULT_OPTIONS = Object.freeze({});

/**
 * @static
 * @memberof module:oyster-streamable.Upload
 * @alias EVENTS
 *
 * @description Events fired during the upload lifecycle
 */
var EVENTS = (exports.EVENTS = Object.freeze({
  /**
   * @event module:oyster-streamable.Upload.EVENTS#UPLOAD_PROGRESS
   * @description Fired when a chunk is attached to the tangle
   *
   * @property {Object} progress - a progress object
   * @property {Number} progress.progress - the percentage of progress for the chunk attachment
   */
  UPLOAD_PROGRESS: "upload-progress",
  /**
   * @event module:oyster-streamable.Upload.EVENTS#FINISH
   * @description Fired when the file has been completely attached to the tangle
   *
   * @property {String} handle - the handle of the file uploaded
   * @property {Object} metadata - the metadata object associated with the file
   */
  FINISH: "finish",
  ERROR: "error"
}));

var UploadProgress = (function(_EventEmitter) {
  _inherits(UploadProgress, _EventEmitter);

  function UploadProgress(handle, options) {
    _classCallCheck(this, UploadProgress);

    var _this = _possibleConstructorReturn(
      this,
      (UploadProgress.__proto__ || Object.getPrototypeOf(UploadProgress)).call(
        this
      )
    );

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    (0, _util.validateKeys)(opts, REQUIRED_OPTS);

    _this.handle = handle;
    _this.options = opts;
    // HACK! Cleanup API so all functions expect either an array or 1 provider.
    _this.iotaProviders = opts.iotaProviders || [opts.iotaProvider];
    _this.chunks = 0;

    (0, _iota.getMetadata)(_this.handle, _this.iotaProviders)
      .then(function(_ref) {
        var metadata = _ref.metadata,
          provider = _ref.provider;

        _this.numberOfChunks = metadata.numberOfChunks;
        _this.iotaProvider = provider;
        _this.pollUploadProgress();
      })
      .catch(function(err) {
        _this.emit("error", err);
      });
    return _this;
  }

  _createClass(
    UploadProgress,
    [
      {
        key: "pollUploadProgress",
        value: function pollUploadProgress() {
          var _this2 = this;

          var genesisHash = _datamapGenerator2.default.genesisHash(this.handle);
          var datamap = _datamapGenerator2.default.generate(
            genesisHash,
            this.numberOfChunks - 1
          );

          // TODO: Update pollIotaProgess to take an array of iotaProviders
          // So that the API matches with downloads.
          (0, _iota.pollIotaProgress)(datamap, this.iotaProviders[0], function(
            prog
          ) {
            _this2.emit(EVENTS.UPLOAD_PROGRESS, { progress: prog });
          }).then(function() {
            _this2.emit(EVENTS.FINISH, {
              target: _this2,
              handle: _this2.handle,
              numberOfChunks: _this2.numberOfChunks,
              metadata: _this2.metadata
            });
          });
        }
      }
    ],
    [
      {
        key: "streamUploadProgress",
        value: function streamUploadProgress(handle, opts) {
          return new UploadProgress(handle, opts);
        }
      }
    ]
  );

  return UploadProgress;
})(_events.EventEmitter);

exports.default = UploadProgress;
