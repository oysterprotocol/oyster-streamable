import IOTA from "iota.lib.js";
import { EventEmitter } from "events";
import Forge from "node-forge";
import DecryptStream from "./streams/decryptStream";
import DownloadStream from "./streams/downloadStream";
import FilePreviewStream from "./streams/filePreviewStream";
import BufferTargetStream from "./streams/bufferTargetStream";

import { genesisHash } from "./utils/encryption";
import { queryGeneratedSignatures } from "./utils/backend";
import { IOTA_API } from "./config";
import * as Util from "./util";

const iota = new IOTA({ provider: IOTA_API.PROVIDER });
const DEFAULT_OPTIONS = Object.freeze({});

export default class Download extends EventEmitter {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super();
    this.startDownload = this.startDownload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.options = opts;
    this.handle = handle;
    this.genesisHash = genesisHash(handle);
    this.key = Util.bytesFromHandle(handle);

    this.getMetadata()
      .then(this.startDownload)
      .catch(this.propagateError);
  }

  static toBuffer(handle, options = {}) {
    const target = {
      targetStream: BufferTargetStream
    };

    return new Download(handle, Object.assign(options, target));
  }

  static toBlob(handle, options = {}) {
    const target = {
      targetStream: FilePreviewStream
    };

    return new Download(handle, Object.assign(options, target));
  }

  getMetadata() {
    return queryGeneratedSignatures(iota, this.genesisHash, 1)
      .then(result => {
        const signature = result.data[0];

        if (signature === null) {
          throw new Error("File does not exist.");
        }

        const { version, metadata } = Util.decryptMetadata(this.key, signature);
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
      iota
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
