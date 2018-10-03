import { EventEmitter } from "events";
import Datamap from "datamap-generator";

import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
import FilePreviewStream from "./streams/filePreviewStream";
import BufferTargetStream from "./streams/bufferTargetStream";
import { getMetadata } from "./utils/iota";
import { bytesFromHandle, validateKeys } from "./util";

const DEFAULT_OPTIONS = Object.freeze({
  autoStart: true
});
const REQUIRED_OPTS = ["iotaProviders"];

/**
 * @static
 * @memberof module:oyster-streamable.Download
 * @alias EVENTS
 *
 * @description Events fired during the download lifecycle
 */
export const EVENTS = Object.freeze({
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
});

/**
 * Downloading files
 */
export default class Download extends EventEmitter {
  /**
   * @constructor Download
   * @hideconstructor
   *
   * @memberof module:oyster-streamable
   */

  /*
   * @deprecated
   * @alias Download
   *
   * @param {String} handle
   * @param {Object} options
   */
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    super();
    this.startDownload = this.startDownload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.options = opts;
    this.handle = handle;
    this.genesisHash = Datamap.genesisHash(handle);
    this.key = bytesFromHandle(handle);

    getMetadata(handle, opts.iotaProviders)
      .then(({ metadata, provider }) => {
        this.iotaProvider = provider;
        this.metadata = metadata;
        this.emit("metadata", metadata);

        if (opts.targetStream && opts.autoStart) this.startDownload();
      })
      .catch(this.propagateError);
  }

  /**
   * @static
   * @memberof module:oyster-streamable.Download
   *
   * @example <caption>To **Buffer** object (node)</caption>
   * ```js
   * const download = Oyster.Download.toBuffer(handle, {
   *   iotaProviders: [
   *     { provider: '' }
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
   * @emits module:oyster-streamable.Download.EVENTS#METADATA
   * @emits module:oyster-streamable.Download.EVENTS#DOWNLOAD_PROGRESS
   * @emits module:oyster-streamable.Download.EVENTS#FINISH
   *
   * @param {String} handle - the handle of the file to download
   * @param {Object} options - the options for the download
   * @param {(Object[]|IOTA[])} options.iotaProviders - an array of IOTA initialization Objects or IOTA instances
   * @param {Boolean} [options.autoStart=true] - immediately start the download
   *
   * @returns {Download}
   */
  static toBuffer(handle, options = {}) {
    const target = { targetStream: BufferTargetStream };
    const opts = Object.assign(options, target);

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
   *     { provider: '' }
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
   * @emits module:oyster-streamable.Download.EVENTS#METADATA
   * @emits module:oyster-streamable.Download.EVENTS#DOWNLOAD_PROGRESS
   * @emits module:oyster-streamable.Download.EVENTS#FINISH
   *
   * @param {String} handle - the handle of the file to download
   * @param {Object} options - the options for the download
   * @param {(Object[]|IOTA[])} options.iotaProviders - an array of IOTA initialization Objects or IOTA instances
   * @param {Boolean} [options.autoStart=true] - immediately start the download
   *
   * @returns {Download}
   */
  static toBlob(handle, options = {}) {
    const target = { targetStream: FilePreviewStream };
    const opts = Object.assign(options, target);

    return new Download(handle, opts);
  }

  startDownload() {
    const { targetStream, targetOptions } = this.options;

    this.downloadStream = new DownloadStream(this.genesisHash, this.metadata, {
      iotaProvider: this.iotaProvider
    });
    this.decryptStream = new DecryptStream(this.key);
    this.targetStream = new targetStream(this.metadata, targetOptions || {});

    this.downloadStream
      .pipe(this.decryptStream)
      .pipe(this.targetStream)
      .on("finish", () => {
        this.emit(EVENTS.FINISH, {
          target: this,
          metadata: this.metadata,
          result: this.targetStream.result
        });
      });

    this.downloadStream.on("progress", progress => {
      this.emit(EVENTS.DOWNLOAD_PROGRESS, { progress });
    });

    this.downloadStream.on("error", this.propagateError);
    this.decryptStream.on("error", this.propagateError);
    this.targetStream.on("error", this.propagateError);
  }
  propagateError(error) {
    this.emit("error", error);
  }
}
