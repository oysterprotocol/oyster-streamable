import { Writable } from "readable-stream";
import Mime from "mime";

const DEFAULT_OPTIONS = Object.freeze({});

export default class FilePreviewStream extends Writable {
  constructor(metadata, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.metadata = metadata;
    this.fileChunks = [];
    this.file = null;
  }
  _write(data, _encoding, callback) {
    this.fileChunks.push(data);
    callback();
  }
  _final(callback) {
    const type = Mime.getType(this.metadata.ext);
    this.result = new Blob(this.fileChunks, { type });
    callback();
  }
}
