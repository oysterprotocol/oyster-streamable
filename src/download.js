import { EventEmitter } from "events";
import Datamap from "datamap-generator";

import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
import FilePreviewStream from "./streams/filePreviewStream";
import BufferTargetStream from "./streams/bufferTargetStream";
import { getMetadata } from "./utils/iota";
import { bytesFromHandle, validateKeys } from "./util";

const DEFAULT_OPTIONS = Object.freeze({});
const REQUIRED_OPTS = ["iotaProviders"];

export const EVENTS = Object.freeze({
  DOWNLOAD_PROGRESS: "download-progress",
  FINISH: "finish"
});

export default class Download extends EventEmitter {
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

        this.startDownload(metadata);
      })
      .catch(this.propagateError);
  }

  static toBuffer(handle, options = {}) {
    const target = { targetStream: BufferTargetStream };
    const opts = Object.assign(options, target);

    return new Download(handle, opts);
  }

  static toBlob(handle, options = {}) {
    const target = { targetStream: FilePreviewStream };
    const opts = Object.assign(options, target);

    return new Download(handle, opts);
  }

  startDownload(metadata) {
    const { targetStream, targetOptions } = this.options;

    this.downloadStream = new DownloadStream(this.genesisHash, metadata, {
      iotaProvider: this.iotaProvider
    });
    this.decryptStream = new DecryptStream(this.key);
    this.targetStream = new targetStream(metadata, targetOptions || {});

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
