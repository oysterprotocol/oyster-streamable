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

var _decryptStream = require("./streams/decryptStream");

var _decryptStream2 = _interopRequireDefault(_decryptStream);

var _downloadStream = require("./streams/downloadStream");

var _downloadStream2 = _interopRequireDefault(_downloadStream);

var _filePreviewStream = require("./streams/filePreviewStream");

var _filePreviewStream2 = _interopRequireDefault(_filePreviewStream);

var _bufferTargetStream = require("./streams/bufferTargetStream");

var _bufferTargetStream2 = _interopRequireDefault(_bufferTargetStream);

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

var DEFAULT_OPTIONS = Object.freeze({
  autoStart: true
});
var REQUIRED_OPTS = ["iotaProviders"];

/**
 * @static
 * @memberof module:oyster-streamable.Download
 * @alias EVENTS
 *
 * @description Events fired during the download lifecycle
 */
var EVENTS = (exports.EVENTS = Object.freeze({
  /**
   * @event module:oyster-streamable.Download.EVENTS#DOWNLOAD_PROGRESS
   * @description Fired when a successful poll is performed while retrieving a file
   *
   * @property {Object} progress - a progress object
   * @property {Number} progress.progress - the percentage of progress for the download
   */
  DOWNLOAD_PROGRESS: "download-progress",
  /**
   * @event module:oyster-streamable.Download.EVENTS#FINISH
   * @description Fired when the file has been reconstructed and is ready for use
   *
   * @property {(File|Buffer)} file - the file as an object as the target type of the download instance
   * @property {Object} metadata - the metadata object associated with the file
   */
  FINISH: "finish",
  /**
   * @event module:oyster-streamable.Download.EVENTS#METADATA
   * @description Fired when the file metadata has been reconstructed and is ready for use
   *
   * @property {String} fileName - the name of the file being downloaded
   * @property {String} ext - the file extension of the file being downloaded
   * @property {Number} numberOfChunks - the number of chunks that the file is stored in
   */
  METADATA: "metadata"
}));

/**
 * Downloading files
 */

var Download = (function(_EventEmitter) {
  _inherits(Download, _EventEmitter);

  /**
   * @constructor Download
   * @hideconstructor
   *
   * @memberof module:oyster-streamable
   *
   * @emits module:oyster-streamable.Download.EVENTS#METADATA
   * @emits module:oyster-streamable.Download.EVENTS#DOWNLOAD_PROGRESS
   * @emits module:oyster-streamable.Download.EVENTS#FINISH
   */

  /*
   * @deprecated
   * @alias Download
   *
   * @param {String} handle
   * @param {Object} options
   */
  function Download(handle, options) {
    _classCallCheck(this, Download);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    (0, _util.validateKeys)(opts, REQUIRED_OPTS);

    var _this = _possibleConstructorReturn(
      this,
      (Download.__proto__ || Object.getPrototypeOf(Download)).call(this)
    );

    _this.startDownload = _this.startDownload.bind(_this);
    _this.propagateError = _this.propagateError.bind(_this);

    _this.options = opts;
    _this.handle = handle;
    _this.genesisHash = _datamapGenerator2.default.genesisHash(handle);
    _this.key = (0, _util.bytesFromHandle)(handle);

    (0, _iota.getMetadata)(handle, opts.iotaProviders)
      .then(function(_ref) {
        var metadata = _ref.metadata,
          provider = _ref.provider;

        _this.iotaProvider = provider;
        _this.metadata = metadata;
        _this.emit("metadata", metadata);

        if (opts.targetStream && opts.autoStart) _this.startDownload();
      })
      .catch(_this.propagateError);
    return _this;
  }

  /**
   * @static
   * @memberof module:oyster-streamable.Download
   *
   * @example <caption>To **Buffer** object (node)</caption>
   * ```js
   * const download = Oyster.Download.toBuffer(handle, {
   *   iotaProviders: [
   *     { provider: 'https://poll.oysternodes.com:14265/' },
   *     { provider: 'https://download.oysternodes.com:14265/' }
   *   ]
   * })
   *
   * download.on('meta', metadata => {
   *   console.log(metadata)
   *   // {fileName: "oyster.txt", ext: "txt", numberOfChunks: 2}
   * })
   * download.on('finish', filedata => {
   *   console.log(filedata)
   *   // {file: Buffer(), metadata: {…}, target: Download}
   * })
   * ```
   *
   * @param {String} handle - the handle of the file to download
   * @param {Object} options - the options for the download
   * @param {(Object[]|IOTA[])} options.iotaProviders - an array of IOTA initialization Objects or IOTA instances
   * @param {Boolean} [options.autoStart=true] - immediately start the download
   *
   * @returns {Download}
   */

  _createClass(
    Download,
    [
      {
        key: "startDownload",
        value: function startDownload() {
          var _this2 = this;

          var _options = this.options,
            targetStream = _options.targetStream,
            targetOptions = _options.targetOptions;

          this.downloadStream = new _downloadStream2.default(
            this.genesisHash,
            this.metadata,
            {
              iotaProvider: this.iotaProvider
            }
          );
          this.decryptStream = new _decryptStream2.default(this.key);
          this.targetStream = new targetStream(
            this.metadata,
            targetOptions || {}
          );

          this.downloadStream
            .pipe(this.decryptStream)
            .pipe(this.targetStream)
            .on("finish", function() {
              _this2.emit(EVENTS.FINISH, {
                target: _this2,
                metadata: _this2.metadata,
                result: _this2.targetStream.result
              });
            });

          this.downloadStream.on("progress", function(progress) {
            _this2.emit(EVENTS.DOWNLOAD_PROGRESS, { progress: progress });
          });

          this.downloadStream.on("error", this.propagateError);
          this.decryptStream.on("error", this.propagateError);
          this.targetStream.on("error", this.propagateError);
        }
      },
      {
        key: "propagateError",
        value: function propagateError(error) {
          this.emit("error", error);
        }
      }
    ],
    [
      {
        key: "toBuffer",
        value: function toBuffer(handle) {
          var options =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : {};

          var target = { targetStream: _bufferTargetStream2.default };
          var opts = Object.assign(options, target);

          return new Download(handle, opts);
        }

        /**
         * @static
         * @memberof module:oyster-streamable.Download
         *
         * @example <caption>To **Blob** object (browser)</caption>
         * ```js
         * const download = Oyster.Download.toBlob(handle, {
         *   iotaProviders: [
         *     { provider: 'https://poll.oysternodes.com:14265/' },
         *     { provider: 'https://download.oysternodes.com:14265/' }
         *   ]
         * })
         *
         * download.on('meta', metadata => {
         *   console.log(metadata)
         *   // {fileName: "oyster.txt", ext: "txt", numberOfChunks: 2}
         * })
         * download.on('finish', filedata => {
         *   console.log(filedata)
         *   // {file: Blob(), metadata: {…}, target: Download}
         * })
         * ```
         *
         * @param {String} handle - the handle of the file to download
         * @param {Object} options - the options for the download
         * @param {(Object[]|IOTA[])} options.iotaProviders - an array of IOTA initialization Objects or IOTA instances
         * @param {Boolean} [options.autoStart=true] - immediately start the download
         *
         * @returns {Download}
         */
      },
      {
        key: "toBlob",
        value: function toBlob(handle) {
          var options =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : {};

          var target = { targetStream: _filePreviewStream2.default };
          var opts = Object.assign(options, target);

          return new Download(handle, opts);
        }
      }
    ]
  );

  return Download;
})(_events.EventEmitter);

exports.default = Download;
