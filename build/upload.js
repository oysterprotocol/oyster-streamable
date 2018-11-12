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

var _fileChunkStream = require("./streams/fileChunkStream");

var _fileChunkStream2 = _interopRequireDefault(_fileChunkStream);

var _bufferSourceStream = require("./streams/bufferSourceStream");

var _bufferSourceStream2 = _interopRequireDefault(_bufferSourceStream);

var _encryptStream = require("./streams/encryptStream");

var _encryptStream2 = _interopRequireDefault(_encryptStream);

var _uploadStream = require("./streams/uploadStream");

var _uploadStream2 = _interopRequireDefault(_uploadStream);

var _backend = require("./utils/backend");

var _util = require("./util");

var _encryption = require("./utils/encryption");

var _fileProcessor = require("./utils/file-processor");

var _iota = require("./utils/iota");

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

var CHUNK_BYTE_SIZE = 1024;
var DEFAULT_OPTIONS = Object.freeze({
  filename: "",
  encryptStream: { chunkByteSize: CHUNK_BYTE_SIZE },
  autoStart: true
});

var REQUIRED_OPTS = [
  "alpha",
  "beta",
  "epochs",
  "iotaProvider",
  "unsignedTreasurePath",
  "signedTreasurePath"
];

/**
 * @static
 * @memberof module:oyster-streamable.Upload
 * @alias EVENTS
 *
 * @description Events fired during the upload lifecycle
 */
var EVENTS = (exports.EVENTS = Object.freeze({
  /**
   * @event module:oyster-streamable.Upload.EVENTS#INVOICE
   * @description Fired when an invoice is recieved from the broker node
   *
   * @property {String} handle - the handle of the file uploaded
   * @property {String} address - an ethereum address to send the pearl to
   * @property {Number} cost - the cost of the file upload
   */
  INVOICE: "invoice",
  PAYMENT_PENDING: "payment-pending",
  PAYMENT_CONFIRMED: "payment-confirmed",
  /**
   * @event module:oyster-streamable.Upload.EVENTS#CHUNKS_PROGRESS
   * @description Fired when a chunk is uploaded to the broker
   *
   * @property {Object} progress - a progress object
   * @property {Number} progress.progress - the percentage of progress for the chunk upload
   */
  CHUNKS_PROGRESS: "chunks-progress",
  /**
   * @event module:oyster-streamable.Upload.EVENTS#UPLOADED
   * @description Fired all chunks have been uploaded to the brokers.
   *
   */
  UPLOADED: "uploaded",

  // TODO:  Do we actually need such an event?
  /**
   * @event module:oyster-streamable.Upload.EVENTS#TREASURE_SIGNED
   * @description Treasure has been signed and sent back to broker.
   *
   */
  // TREASURE_SIGNED: "treasure-signed",

  // {
  //   target: this,
  //   handle: this.handle,
  //   numberOfChunks: this.numberOfChunks,
  //   metadata: this.metadata
  // }
  /**
   * @event module:oyster-streamable.Upload.EVENTS#META_ATTACHED
   * @description Fired when the meta chunk has been attached. This is needed
   *              in order to resume polling for upload progress.
   *
   * @property {Object} target - the upload object
   * @property {String} handle - the handle of the uploaded file
   * @property {Number} numberOfChunks - the number of chunks for the file
   * @property {Object} metadata - the metadata object
   */
  META_ATTACHED: "meta-attached", // Same as RETRIEVED
  RETRIEVED: "retrieved", // DEPRECATED
  ERROR: "error"
}));

// TODO: Figure out which ivars are actually needed vs. just locally scoped.
// Then convert all ivars to local consts

/**
 * Uploading files
 */

var Upload = (function(_EventEmitter) {
  _inherits(Upload, _EventEmitter);

  /**
   * @constructor Upload
   * @hideconstructor
   *
   * @memberof module:oyster-streamable
   *
   * @emits module:oyster-streamable.Upload.EVENTS#INVOICE
   * @emits module:oyster-streamable.Upload.EVENTS#CHUNKS_PROGRESS
   * @emits module:oyster-streamable.Upload.EVENTS#UPLOAD_PROGRESS
   * @emits module:oyster-streamable.Upload.EVENTS#FINISH
   */

  /*
   * @deprecated
   * @alias Upload
   *
   * @param {String} filename - the name of the file being uploaded
   * @param {Number} size - the size of the file
   * @param {Object} options - the options for the upload
   */
  function Upload(filename, size, options) {
    _classCallCheck(this, Upload);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);
    (0, _util.validateKeys)(opts, REQUIRED_OPTS);

    var chunkCount = Math.ceil(size / CHUNK_BYTE_SIZE);
    var totalChunks = chunkCount + 1;

    var _this = _possibleConstructorReturn(
      this,
      (Upload.__proto__ || Object.getPrototypeOf(Upload)).call(this)
    );

    _this.startUpload = _this.startUpload.bind(_this);
    _this.propagateError = _this.propagateError.bind(_this);

    _this.alpha = opts.alpha;
    _this.beta = opts.beta;
    _this.epochs = opts.epochs;
    _this.iotaProviders = [opts.iotaProvider];
    _this.options = opts;
    _this.unsignedTreasurePath = opts.unsignedTreasurePath;
    _this.signedTreasurePath = opts.signedTreasurePath;
    _this.filename = filename;
    _this.handle = (0, _encryption.createHandle)(filename);
    _this.metadata = (0, _fileProcessor.createMetaData)(filename, chunkCount);
    _this.genesisHash = (0, _encryption.genesisHash)(_this.handle);
    _this.key = (0, _util.bytesFromHandle)(_this.handle);
    _this.numberOfChunks = totalChunks;

    // hack to stub brokers for testing.
    var createUploadSessionFn =
      _this.options.createUploadSession || _backend.createUploadSession;

    _this.uploadSession = createUploadSessionFn(
      size,
      _this.genesisHash,
      totalChunks,
      _this.alpha,
      _this.beta,
      _this.epochs
    );

    if (opts.autoStart)
      _this.uploadSession
        .then(_this.startUpload.bind(_this))
        .catch(_this.propagateError.bind(_this));
    return _this;
  }

  /**
   * @static
   * @memberof module:oyster-streamable.Upload
   *
   * @example <caption>From **File** object (browser)</caption>
   * ```js
   * const file = fileInput.files[0];
   * const upload = Oyster.Upload.fromFile(file, {
   *   iotaProvider: { provider: 'https://poll.oysternodes.com:14265/' },
   *   alpha: 'https://broker-1.oysternodes.com/',
   *   beta: 'https://broker-2.oysternodes.com/',
   *   epochs: 1
   * });
   *
   * upload.on('invoice', invoice => {
   *   console.log(invoice)
   *   // {address: "<ETH_ADDRESS>", cost: 20}
   * });
   * upload.on('finish', filedata => {
   *   console.log(filedata)
   *   // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}
   * });
   * ```
   *
   * @param {File} file - the file to upload
   * @param {Object} options - the options for the upload
   * @param {(Object|IOTA)} options.iotaProvider - an IOTA initialization Object or IOTA instance
   * @param {String} options.alpha - the endpoint for the alpha broker
   * @param {String} options.beta - the endpoint for the beta broker
   * @param {Number} options.epochs - the number of years to store the file
   * @param {Boolean} [options.autoStart=true] - immediately start the upload
   *
   * @returns {Upload}
   */

  _createClass(
    Upload,
    [
      {
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

            this.emit(EVENTS.RETRIEVED); // This will be deprecated
            this.emit(EVENTS.META_ATTACHED);

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
          (0, _backend.confirmPendingPoll)(host, sessIdA)
            .then(function() {
              _this2.emit(EVENTS.PAYMENT_PENDING);
              return (0, _backend.confirmPaidPoll)(host, sessIdA);
            })
            .then(function() {
              _this2.emit(EVENTS.PAYMENT_CONFIRMED, {
                filename: _this2.filename,
                handle: _this2.handle,
                numberOfChunks: _this2.numberOfChunks
              });

              var progressCb = function progressCb(progress) {
                return _this2.emit(EVENTS.CHUNKS_PROGRESS, {
                  progress: progress
                });
              };

              _this2.sourceStream = new sourceStream(
                sourceData,
                sourceOptions || {}
              );
              _this2.encryptStream = new _encryptStream2.default(_this2.handle);
              _this2.uploadStream = new _uploadStream2.default(
                metadata,
                _this2.genesisHash,
                _this2.metadata.numberOfChunks,
                _this2.alpha,
                _this2.beta,
                sessIdA,
                sessIdB,
                { progressCb: progressCb }
              );

              _this2.sourceStream
                .pipe(_this2.encryptStream)
                .pipe(_this2.uploadStream)
                .on("finish", function() {
                  _this2.emit(EVENTS.UPLOADED, {
                    target: _this2,
                    handle: _this2.handle
                  });
                  (0, _backend.signTreasures)(
                    {
                      broker: _this2.alpha,
                      sessionID: sessIdA
                    },
                    {
                      broker: _this2.beta,
                      sessionID: sessIdB
                    },
                    _this2.handle,
                    _this2.unsignedTreasurePath,
                    _this2.signedTreasurePath
                  ).then(function(result) {
                    (0, _iota.pollMetadata)(
                      _this2.handle,
                      _this2.iotaProviders
                    ).then(function() {
                      // This will be deprecated
                      _this2.emit(EVENTS.RETRIEVED, {
                        target: _this2,
                        handle: _this2.handle,
                        numberOfChunks: _this2.numberOfChunks,
                        metadata: _this2.metadata
                      });
                      _this2.emit(EVENTS.META_ATTACHED, {
                        target: _this2,
                        handle: _this2.handle,
                        numberOfChunks: _this2.numberOfChunks,
                        metadata: _this2.metadata
                      });
                    });
                  });
                });

              _this2.sourceStream.on("error", _this2.propagateError);
              _this2.encryptStream.on("error", _this2.propagateError);
              _this2.uploadStream.on("error", _this2.propagateError);
            })
            .catch(this.propagateError.bind(this));
        }
      },
      {
        key: "propagateError",
        value: function propagateError(error) {
          this.emit(EVENTS.ERROR, error);
        }
      }
    ],
    [
      {
        key: "fromFile",
        value: function fromFile(file) {
          var options =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : {};

          var source = {
            sourceData: file,
            sourceStream: _fileChunkStream2.default
          };
          var opts = Object.assign(options, source);

          return new Upload(file.name, file.size, opts);
        }

        /**
         * @static
         * @memberof module:oyster-streamable.Upload
         *
         * @example <caption>From **Buffer** object (node)</caption>
         * ```js
         * const fs = require('fs');
         * const path = './path/to/file';
         * const filename = 'somefile.txt';
         *
         * fs.readFile(`${path}/${filename}`, (err, data) => {
         *   if (err) throw err;
         *
         *   const upload = Oyster.Upload.fromData(data, filename, {
         *     iotaProvider: { provider: 'https://poll.oysternodes.com:14265/' },
         *     alpha: 'https://broker-1.oysternodes.com/',
         *     beta: 'https://broker-2.oysternodes.com/',
         *     epochs: 1
         *   });
         *
         *   upload.on('invoice', invoice => {
         *     console.log(invoice)
         *     // {address: "<ETH_ADDRESS>", cost: 20}
         *   });
         *   upload.on('finish', filedata => {
         *     console.log(filedata)
         *     // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}
         *   });
         * });
         * ```
         *
         * @param {Buffer} buffer - the data Buffer to upload
         * @param {String} filename - the name of the file
         * @param {Object} options - the options for the upload
         * @param {(Object|IOTA)} options.iotaProvider - an IOTA initialization Object or IOTA instance
         * @param {String} options.alpha - the endpoint for the alpha broker
         * @param {String} options.beta - the endpoint for the beta broker
         * @param {Number} options.epochs - the number of years to store the file
         * @param {Boolean} [options.autoStart=true] - immediately start the upload
         *
         * @returns {Upload}
         */
      },
      {
        key: "fromData",
        value: function fromData(buffer, filename) {
          var options =
            arguments.length > 2 && arguments[2] !== undefined
              ? arguments[2]
              : {};

          var source = {
            sourceData: buffer,
            sourceStream: _bufferSourceStream2.default
          };
          var opts = Object.assign(options, source);

          return new Upload(filename, buffer.length, opts);
        }
      }
    ]
  );

  return Upload;
})(_events.EventEmitter);

exports.default = Upload;
