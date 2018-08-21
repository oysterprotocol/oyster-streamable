import { EventEmitter } from "events";
import Datamap from "datamap-generator";
import { pollIotaProgress } from "./utils/iota";
import { EVENTS } from "./upload";
import { validateKeys } from "./util";
import { getMetadata } from "./utils/iota";
import { createMetaData } from "./utils/file-processor";

const REQUIRED_OPTS = ["iotaProvider"];
const DEFAULT_OPTIONS = Object.freeze({});

export default class UploadProgress extends EventEmitter {
  constructor(handle, options) {
    super();

    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    this.handle = handle
    this.options = opts;
    this.iotaProviders = [opts.iotaProvider];
    this.chunks = 0;

    getMetadata(this.handle, this.iotaProviders).then(({ metadata, provider }) => {
      this.numberOfChunks = metadata.numberOfChunks;
      this.iotaProvider = provider;

      this.pollUploadProgress()
    })
      .catch(this.propagateError);


  }

  static streamUploadProgress(handle, opts) {
    console.log("Check upload progress on :", handle);
    return new UploadProgress(handle, opts);
  }

  pollUploadProgress() {
    const genesisHash = Datamap.genesisHash(this.handle);
    const datamap = Datamap.generate(genesisHash, this.numberOfChunks - 1);

    pollIotaProgress(datamap, this.iotaProvider, prog => {
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
