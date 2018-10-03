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

export const EVENTS = Object.freeze({
  DOWNLOAD_PROGRESS: "download-progress",
  FINISH: "finish"
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
