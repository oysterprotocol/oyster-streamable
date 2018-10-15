import { EventEmitter } from "events";
import Datamap from "datamap-generator";

import { pollIotaProgress } from "./utils/iota";
import { validateKeys } from "./util";
import { getMetadata } from "./utils/iota";

const REQUIRED_OPTS = ["iotaProvider"];
const DEFAULT_OPTIONS = Object.freeze({});

/**
 * @static
 * @memberof module:oyster-streamable.Upload
 * @alias EVENTS
 *
 * @description Events fired during the upload lifecycle
 */
export const EVENTS = Object.freeze({
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
});

export default class UploadProgress extends EventEmitter {
  constructor(handle, options) {
    super();

    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    this.handle = handle;
    this.options = opts;
    // HACK! Cleanup API so all functions expect either an array or 1 provider.
    this.iotaProviders = opts.iotaProviders || [opts.iotaProvider];
    this.chunks = 0;

    getMetadata(this.handle, this.iotaProviders)
      .then(({ metadata, provider }) => {
        this.numberOfChunks = metadata.numberOfChunks;
        this.iotaProvider = provider;
        this.pollUploadProgress();
      })
      .catch(err => {
        this.emit("error", err);
      });
  }

  static streamUploadProgress(handle, opts) {
    return new UploadProgress(handle, opts);
  }

  pollUploadProgress() {
    const genesisHash = Datamap.genesisHash(this.handle);
    const datamap = Datamap.generate(genesisHash, this.numberOfChunks - 1);

    // TODO: Update pollIotaProgess to take an array of iotaProviders
    // So that the API matches with downloads.
    pollIotaProgress(datamap, this.iotaProviders[0], prog => {
      this.emit(EVENTS.UPLOAD_PROGRESS, { progress: prog });
    }).then(() => {
      this.emit(EVENTS.FINISH, {
        target: this,
        handle: this.handle,
        numberOfChunks: this.numberOfChunks,
        metadata: this.metadata
      });
    });
  }
}
