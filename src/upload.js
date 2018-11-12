import { EventEmitter } from "events";
import Datamap from "datamap-generator";

import FileChunkStream from "./streams/fileChunkStream";
import BufferSourceStream from "./streams/bufferSourceStream";
import EncryptStream from "./streams/encryptStream";
import UploadStream from "./streams/uploadStream";

import { signTreasures } from "./utils/backend";
import { bytesFromHandle, encryptMetadata, validateKeys } from "./util";
import { createHandle, genesisHash } from "./utils/encryption";
import {
  createUploadSession,
  confirmPendingPoll,
  confirmPaidPoll
} from "./utils/backend";
import { createMetaData } from "./utils/file-processor";
import { pollMetadata } from "./utils/iota";

const CHUNK_BYTE_SIZE = 1024;
const DEFAULT_OPTIONS = Object.freeze({
  filename: "",
  encryptStream: { chunkByteSize: CHUNK_BYTE_SIZE },
  autoStart: true
});

const REQUIRED_OPTS = [
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
export const EVENTS = Object.freeze({
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
});

// TODO: Figure out which ivars are actually needed vs. just locally scoped.
// Then convert all ivars to local consts

/**
 * Uploading files
 */
export default class Upload extends EventEmitter {
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
  constructor(filename, size, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    const chunkCount = Math.ceil(size / CHUNK_BYTE_SIZE);
    const totalChunks = chunkCount + 1;

    super();
    this.startUpload = this.startUpload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.alpha = opts.alpha;
    this.beta = opts.beta;
    this.epochs = opts.epochs;
    this.iotaProviders = [opts.iotaProvider];
    this.options = opts;
    this.unsignedTreasurePath = opts.unsignedTreasurePath;
    this.signedTreasurePath = opts.signedTreasurePath;
    this.filename = filename;
    this.handle = createHandle(filename);
    this.metadata = createMetaData(filename, chunkCount);
    this.genesisHash = genesisHash(this.handle);
    this.key = bytesFromHandle(this.handle);
    this.numberOfChunks = totalChunks;

    // hack to stub brokers for testing.
    const createUploadSessionFn =
      this.options.createUploadSession || createUploadSession;

    this.uploadSession = createUploadSessionFn(
      size,
      this.genesisHash,
      totalChunks,
      this.alpha,
      this.beta,
      this.epochs
    );

    if (opts.autoStart)
      this.uploadSession
        .then(this.startUpload.bind(this))
        .catch(this.propagateError.bind(this));
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
  static fromFile(file, options = {}) {
    const source = { sourceData: file, sourceStream: FileChunkStream };
    const opts = Object.assign(options, source);

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
  static fromData(buffer, filename, options = {}) {
    const source = { sourceData: buffer, sourceStream: BufferSourceStream };
    const opts = Object.assign(options, source);

    return new Upload(filename, buffer.length, opts);
  }

  startUpload(session) {
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

    const sessIdA = session.alphaSessionId;
    const sessIdB = session.betaSessionId;
    const invoice = session.invoice || null;
    const host = this.alpha;
    const metadata = encryptMetadata(this.metadata, this.key);
    const { sourceStream, sourceData, sourceOptions } = this.options;

    this.emit(EVENTS.INVOICE, invoice);

    // Wait for payment.
    confirmPendingPoll(host, sessIdA)
      .then(() => {
        this.emit(EVENTS.PAYMENT_PENDING);
        return confirmPaidPoll(host, sessIdA);
      })
      .then(() => {
        this.emit(EVENTS.PAYMENT_CONFIRMED, {
          filename: this.filename,
          handle: this.handle,
          numberOfChunks: this.numberOfChunks
        });

        const progressCb = progress =>
          this.emit(EVENTS.CHUNKS_PROGRESS, { progress });

        this.sourceStream = new sourceStream(sourceData, sourceOptions || {});
        this.encryptStream = new EncryptStream(this.handle);
        this.uploadStream = new UploadStream(
          metadata,
          this.genesisHash,
          this.metadata.numberOfChunks,
          this.alpha,
          this.beta,
          sessIdA,
          sessIdB,
          { progressCb }
        );

        this.sourceStream
          .pipe(this.encryptStream)
          .pipe(this.uploadStream)
          .on("finish", () => {
            this.emit(EVENTS.UPLOADED, { target: this, handle: this.handle });
            signTreasures(
              {
                broker: this.alpha,
                sessionID: sessIdA
              },
              {
                broker: this.beta,
                sessionID: sessIdB
              },
              this.handle,
              this.unsignedTreasurePath,
              this.signedTreasurePath
            ).then(result => {});

            pollMetadata(this.handle, this.iotaProviders)
              .then(() => {
                // This will be deprecated
                this.emit(EVENTS.RETRIEVED, {
                  target: this,
                  handle: this.handle,
                  numberOfChunks: this.numberOfChunks,
                  metadata: this.metadata
                });
                this.emit(EVENTS.META_ATTACHED, {
                  target: this,
                  handle: this.handle,
                  numberOfChunks: this.numberOfChunks,
                  metadata: this.metadata
                });
              })
              .catch(result => {
                debugger;
              });
          });

        this.sourceStream.on("error", this.propagateError);
        this.encryptStream.on("error", this.propagateError);
        this.uploadStream.on("error", this.propagateError);
      })
      .catch(this.propagateError.bind(this));
  }
  propagateError(error) {
    this.emit(EVENTS.ERROR, error);
  }
}
