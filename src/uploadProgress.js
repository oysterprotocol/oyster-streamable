import { EventEmitter } from "events";
import Datamap from "datamap-generator";
import { pollIotaProgress } from "./utils/iota";
import { EVENTS } from "./upload";
import { validateKeys } from "./util";
import { createMetaData } from "./utils/file-processor";

const REQUIRED_OPTS = ["iotaProvider"];
const DEFAULT_OPTIONS = Object.freeze({
  iotaProvider: ""
});

export default class UploadProgress extends EventEmitter {
  constructor(handle, options) {
    super();

    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    this.numberOfChunks = 4; //needed
    this.options = opts;
    this.iotaProvider = opts.iotaProvider;
    this.metadata = "stuff"; //needed

    this.pollUploadProgress(handle)
  }

  static streamUploadProgress(handle) {
    console.log('Check upload progress on :', handle)
    return new UploadProgress(handle)
  }

  pollUploadProgress(handle) {
    console.log(this.numberOfChunks)
    const genHash = Datamap.genesisHash(handle);
    const datamap = Datamap.generate(genHash, this.numberOfChunks - 1);

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