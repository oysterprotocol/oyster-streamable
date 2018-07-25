import { EventEmitter } from "events";
import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
import FilePreviewStream from "./streams/filePreviewStream";
import BufferTargetStream from "./streams/bufferTargetStream";
import Datamap from "datamap-generator";

import { queryGeneratedSignatures } from "./utils/backend";
import { bytesFromHandle, decryptMetadata, validateKeys } from "./util";

const DEFAULT_OPTIONS = Object.freeze({
  autoStart: true
});
const REQUIRED_OPTS = ["iotaProvider"];

export default class Download extends EventEmitter {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    super();
    this.startDownload = this.startDownload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.options = opts;
    this.iota = opts.iotaProvider;
    this.handle = handle;
    this.genesisHash = Datamap.genesisHash(handle);
    this.key = bytesFromHandle(handle);

    this.getMetadata().then(() => {
      if (opts.targetStream && opts.autoStart)
        this.startDownload()
    }).catch(this.propagateError);
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

  getMetadata() {
    return queryGeneratedSignatures(this.iota, this.genesisHash, 1)
      .then(result => {
        const signature = result.data[0];

        if (signature === null) {
          throw new Error("File does not exist.");
        }

        const { version, metadata } = decryptMetadata(this.key, signature);
        this.emit("metadata", metadata);
        this.metadata = metadata;
        return Promise.resolve(metadata);
      })
      .catch(error => {
        throw error;
      });
  }
  startDownload(metadata) {
    const { targetStream, targetOptions } = this.options;

    this.downloadStream = new DownloadStream(this.genesisHash, metadata, {
      iota: this.iota
    });
    this.decryptStream = new DecryptStream(this.key);
    this.targetStream = new targetStream(metadata, targetOptions || {});

    this.downloadStream
      .pipe(this.decryptStream)
      .pipe(this.targetStream)
      .on("finish", () => {
        this.emit("finish", {
          target: this,
          metadata: this.metadata,
          result: this.targetStream.result
        });
      });

    this.downloadStream.on("error", this.propagateError);
    this.decryptStream.on("error", this.propagateError);
    this.targetStream.on("error", this.propagateError);
  }
  propagateError(error) {
    this.emit("error", error);
  }
}
