import { EventEmitter } from "events";
import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
import FilePreviewStream from "./streams/filePreviewStream";
import BufferTargetStream from "./streams/bufferTargetStream";
import Datamap from "datamap-generator";

import { queryGeneratedSignatures } from "./utils/backend";
import { bytesFromHandle, decryptMetadata, validateKeys } from "./util";

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

    this.getMetadata(opts.iotaProviders)
      .then(this.startDownload)
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

  getMetadata(iotaProviders) {
    const queries = Promise.all(
      iotaProviders.map(
        provider =>
          new Promise((resolve, reject) => {
            queryGeneratedSignatures(provider, this.genesisHash, 1).then(
              signatures => resolve({ provider, signatures }),
              reject
            );
          })
      )
    );

    return queries
      .then(result => {
        const { provider, signatures } = result.find(
          res => !!res.signatures.data[0]
        );
        const signature = signatures ? signatures.data[0] : null;

        if (signature === null) {
          throw new Error("File does not exist.");
        }

        const { version, metadata } = decryptMetadata(this.key, signature);
        this.iotaProvider = provider;
        this.metadata = metadata;
        this.emit("metadata", metadata);
        return Promise.resolve(metadata);
      })
      .catch(error => {
        throw error;
      });
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
