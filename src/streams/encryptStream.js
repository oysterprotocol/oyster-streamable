import { Transform } from "readable-stream";
import Datamap from "datamap-generator";

import { bytesFromHandle, encryptBytes, addStopperTryte } from "../util";
import { deriveNonce } from "../utils/encryption";

const DEFAULT_OPTIONS = Object.freeze({
  objectMode: true
});

export default class EncryptStream extends Transform {
  constructor(handle, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);

    super(opts);
    this.options = opts;
    this.key = bytesFromHandle(handle);
    this.genesisHash = Datamap.genesisHash(handle);
  }
  _transform(chunk, encoding, callback) {
    const key = this.key;
    const iv = deriveNonce(this.key, chunk.idx);

    chunk.data = addStopperTryte(encryptBytes(key, iv, chunk.data));

    callback(null, chunk);
  }
}
