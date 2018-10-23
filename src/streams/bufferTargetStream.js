import { Writable } from "readable-stream";

const DEFAULT_OPTIONS = Object.freeze({});

export default class BufferTargetStream extends Writable {
  constructor(metadata, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.metadata = metadata;
    this.chunks = [];
    this.totalLength = 0;
  }
  _write(data, encoding, callback) {
    this.totalLength += data.length;
    this.chunks.push(data);
    callback();
  }
  _final(callback) {
    this.result = new Buffer.concat(this.chunks, this.totalLength);
    callback();
  }
}
