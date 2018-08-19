"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var API = exports.API = Object.freeze({
  // HOST: "http://localhost:8000",
  HOST: "https://broker-1.oysternodes.com",
  V2_UPLOAD_SESSIONS_PATH: ":3000/api/v2/upload-sessions",
  CHUNKS_PER_REQUEST: 10
});

var IOTA_API = exports.IOTA_API = Object.freeze({
  PROVIDER: "https://download.oysternodes.com:14265/",
  ADDRESS_LENGTH: 81,
  MESSAGE_LENGTH: 2187,
  BUNDLE_SIZE: 30
});

var UPLOAD_STATUSES = exports.UPLOAD_STATUSES = Object.freeze({
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED"
});

var DOWNLOAD_STATUSES = exports.DOWNLOAD_STATUSES = Object.freeze({
  STANDBY: "STANDBY",
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  FAILED: "FAILED"
});

var FILE = exports.FILE = Object.freeze({
  CHUNKS_PER_SECTOR: 1000000,
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  CHUNK_TYPES: {
    METADATA: "METADATA",
    FILE_CONTENTS: "FILE_CONTENTS"
  }
});

var INCLUDE_TREASURE_OFFSETS = exports.INCLUDE_TREASURE_OFFSETS = true;