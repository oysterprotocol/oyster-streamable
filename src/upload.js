import { EventEmitter } from "events";
import Datamap from "datamap-generator";

import FileChunkStream from "./streams/fileChunkStream";
import BufferSourceStream from "./streams/bufferSourceStream";
import EncryptStream from "./streams/encryptStream";
import UploadStream from "./streams/uploadStream";

import { createHandle, genesisHash } from "./utils/encryption";
import {
  createUploadSession,
  confirmPendingPoll,
  confirmPaidPoll
} from "./utils/backend";
import { createMetaData } from "./utils/file-processor";
import { bytesFromHandle, encryptMetadata, validateKeys } from "./util";
import { pollIotaProgress } from "./utils/iota";

const CHUNK_BYTE_SIZE = 1024;
const DEFAULT_OPTIONS = Object.freeze({
  filename: "",
  encryptStream: { chunkByteSize: CHUNK_BYTE_SIZE }
});

const REQUIRED_OPTS = ["alpha", "beta", "epochs", "iotaProvider"];

export const EVENTS = Object.freeze({
  INVOICE: "invoice",
  PAYMENT_PENDING: "payment-pending",
  PAYMENT_CONFIRMED: "payment-confirmed",
  // Maybe change this to "uploaded", with upload-progress renamed attach-progress or something
  RETRIEVED: "retrieved",
  UPLOAD_PROGRESS: "upload-progress",
  FINISH: "finish",
  ERROR: "error"
});

// TODO: Figure out which ivars are actually needed vs. just locally scoped.
// Then convert all ivars to local consts

export default class Upload extends EventEmitter {
  constructor(filename, size, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    validateKeys(opts, REQUIRED_OPTS);

    const chunkCount = Math.ceil(size / CHUNK_BYTE_SIZE);
    const totalChunks = chunkCount + 1;

    super();
    this.startUpload = this.startUpload.bind(this);
    this.propagateError = this.propagateError.bind(this);

    this.alpha = opts.alpha;
    this.beta = opts.beta;
    this.epochs = opts.epochs;
    this.iotaProvider = opts.iotaProvider;
    this.options = opts;
    this.filename = filename;
    this.handle = createHandle(filename);
    this.metadata = createMetaData(filename, chunkCount);
    this.genesisHash = genesisHash(this.handle);
    this.key = bytesFromHandle(this.handle);
    this.numberOfChunks = totalChunks;

    // hack to stub brokers for testing.
    const createUploadSessionFn =
      this.options.createUploadSession || createUploadSession;

    this.uploadSession = createUploadSessionFn(
      size,
      this.genesisHash,
      totalChunks,
      this.alpha,
      this.beta,
      this.epochs
    )
      .then(this.startUpload.bind(this))
      .catch(this.propagateError.bind(this));
  }

  // File object (browser)
  static fromFile(file, options = {}) {
    const source = { sourceData: file, sourceStream: FileChunkStream };
    const opts = Object.assign(options, source);

    return new Upload(file.name, file.size, opts);
  }

  // Uint8Array or node buffer
  static fromData(buffer, filename, options = {}) {
    const source = { sourceData: buffer, sourceStream: BufferSourceStream };
    const opts = Object.assign(options, source);

    return new Upload(filename, buffer.length, opts);
  }

  startUpload(session) {
    if (!!this.options.testEnv) {
      // TODO: Actually implement these.
      // Stubbing for now to work on integration.

      this.emit(EVENTS.INVOICE, session.invoice);
      this.emit(EVENTS.PAYMENT_PENDING);

      // This is currently what the client expects, not sure if this
      // payload makes sense to be emitted here...
      // TODO: Better stubs and mocks.
      this.emit(EVENTS.PAYMENT_CONFIRMED, {
        filename: this.filename,
        handle: this.handle,
        numberOfChunks: this.numberOfChunks
      });

      this.emit(EVENTS.UPLOAD_PROGRESS, { progress: 0.123 });

      this.emit(EVENTS.FINISH);
      return;
    }

    const sessIdA = session.alphaSessionId;
    const sessIdB = session.betaSessionId;
    const invoice = session.invoice || null;
    const host = this.alpha;
    const metadata = encryptMetadata(this.metadata, this.key);
    const { sourceStream, sourceData, sourceOptions } = this.options;

    this.emit(EVENTS.INVOICE, invoice);

    // Wait for payment.
    confirmPendingPoll(host, sessIdA)
      .then(() => {
        this.emit(EVENTS.PAYMENT_PENDING);
        return confirmPaidPoll(host, sessIdA);
      })
      .then(() => {
        this.emit(EVENTS.PAYMENT_CONFIRMED, {
          filename: this.filename,
          handle: this.handle,
          numberOfChunks: this.numberOfChunks
        });

        this.sourceStream = new sourceStream(sourceData, sourceOptions || {});
        this.encryptStream = new EncryptStream(this.handle);
        this.uploadStream = new UploadStream(
          metadata,
          this.genesisHash,
          this.metadata.numberOfChunks,
          this.alpha,
          this.beta,
          sessIdA,
          sessIdB
        );

        this.sourceStream
          .pipe(this.encryptStream)
          .pipe(this.uploadStream)
          .on("finish", () => {
            const genHash = Datamap.genesisHash(this.handle);
            const datamap = Datamap.generate(genHash, this.numberOfChunks - 1);

            this.emit(EVENTS.RETRIEVED, {
              target: this,
              handle: this.handle,
              numberOfChunks: this.numberOfChunks,
              metadata: this.metadata
            });

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
          });

        this.sourceStream.on("error", this.propagateError);
        this.encryptStream.on("error", this.propagateError);
        this.uploadStream.on("error", this.propagateError);
      })
      .catch(this.propagateError.bind(this));
  }
  propagateError(error) {
    this.emit(EVENTS.ERROR, error);
  }
}
