"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iota = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.bytesFromHandle = bytesFromHandle;
exports.offsetHash = offsetHash;
exports.addStopperTryte = addStopperTryte;
exports.parseMessage = parseMessage;
exports.encrypt = encrypt;
exports.encryptString = encryptString;
exports.encryptBytes = encryptBytes;
exports.encryptMetadata = encryptMetadata;
exports.decrypt = decrypt;
exports.decryptBytes = decryptBytes;
exports.decryptString = decryptString;
exports.decryptMetadata = decryptMetadata;
exports.getVersion = getVersion;
exports.versionTrytes = versionTrytes;

var _iotaLib = require("iota.lib.js");

var _iotaLib2 = _interopRequireDefault(_iotaLib);

var _nodeForge = require("node-forge");

var _nodeForge2 = _interopRequireDefault(_nodeForge);

var _encryption = require("./utils/encryption");

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CURRENT_VERSION = 1;
var STOPPER_TRYTE = "A";
var IV_BYTE_LENGTH = 16;
var TAG_BYTE_LENGTH = 16;
var TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;

var iota = exports.iota = new _iotaLib2.default();

function bytesFromHandle(handle) {
  return _nodeForge2.default.md.sha256.create().update(handle, "utf8").digest();
}

// Offset hashes for IXI Oyster.findGeneratedSignatures
// Pass genesisHash, absolute offset (0 = first file chunk)
// Alternatively pass last hash, relative offset, to save cycles
function offsetHash(hashStr, offset) {
  var obfuscatedHash = void 0;
  var hash = _nodeForge2.default.util.createBuffer(_nodeForge2.default.util.binary.hex.decode(hashStr)).bytes();

  do {
    var _hashChain = (0, _encryption.hashChain)(hash);

    var _hashChain2 = _slicedToArray(_hashChain, 2);

    obfuscatedHash = _hashChain2[0];
    hash = _hashChain2[1];
  } while (offset-- > 0);

  return _nodeForge2.default.util.binary.hex.encode(hash);
}

function addStopperTryte(trytes) {
  return trytes + STOPPER_TRYTE;
}

function parseMessage(trytes) {
  return trytes.substring(0, trytes.lastIndexOf(STOPPER_TRYTE));
}

// Encryption to trytes
function encrypt(key, iv, binaryString) {
  key.read = 0;
  var cipher = _nodeForge2.default.cipher.createCipher("AES-GCM", key);

  cipher.start({
    iv: iv,
    additionalData: "binary-encoded string",
    tagLength: TAG_BIT_LENGTH
  });

  cipher.update(binaryString);
  cipher.finish();

  var ivTrytes = iota.utils.toTrytes(iv);
  var tagTrytes = iota.utils.toTrytes(cipher.mode.tag.bytes());
  var trytes = iota.utils.toTrytes(cipher.output.bytes());

  return trytes + tagTrytes + ivTrytes;
}

function encryptString(key, iv, string, encoding) {
  var buf = _nodeForge2.default.util.createBuffer(string, encoding || "utf8");
  return encrypt(key, iv, buf);
}

function encryptBytes(key, iv, bytes) {
  return encrypt(key, iv, _nodeForge2.default.util.createBuffer(bytes));
}

function encryptMetadata(metadata, key) {
  var iv = (0, _encryption.deriveNonce)(key, 0);
  var trytes = encryptString(key, iv, JSON.stringify(metadata), "utf8");
  return addStopperTryte(versionTrytes() + trytes);
}

// Decryption from trytes
function decrypt(key, byteBuffer) {
  key.read = 0;
  var byteStr = byteBuffer.bytes();
  var tag = byteStr.substr(-TAG_BYTE_LENGTH - IV_BYTE_LENGTH, TAG_BYTE_LENGTH);
  var iv = byteStr.substr(-IV_BYTE_LENGTH);
  var end = byteStr.length - TAG_BYTE_LENGTH - IV_BYTE_LENGTH;
  var msg = byteStr.substr(0, end);
  var decipher = _nodeForge2.default.cipher.createDecipher("AES-GCM", key);

  decipher.start({
    iv: iv,
    additionalData: "binary-encoded string",
    tagLength: TAG_BIT_LENGTH,
    tag: tag
  });
  decipher.update(new _nodeForge2.default.util.ByteBuffer(msg, "binary"));

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}

function decryptBytes(key, byteBuffer) {
  var output = decrypt(key, byteBuffer);
  if (output) {
    return _nodeForge2.default.util.binary.raw.decode(output.bytes());
  } else {
    return false;
  }
}

function decryptString(key, byteBuffer, encoding) {
  var output = decrypt(key, byteBuffer);
  if (output) {
    return output.toString(encoding || "utf8");
  } else {
    return false;
  }
}

function decryptMetadata(key, signature) {
  var trytes = parseMessage(signature);
  var byteStr = iota.utils.fromTrytes(trytes);
  var byteBuffer = _nodeForge2.default.util.createBuffer(byteStr, "binary");
  var version = getVersion(byteBuffer);
  var metadata = JSON.parse(decryptString(key, byteBuffer.compact()));

  return { version: version, metadata: metadata };
}

function getVersion(byteBuffer) {
  var bytes = _nodeForge2.default.util.binary.raw.decode(byteBuffer.getBytes(4));
  return new DataView(bytes.buffer).getUint32(0);
}

function versionTrytes() {
  var typedVersion = new DataView(new ArrayBuffer(4));
  typedVersion.setUint32(0, CURRENT_VERSION);
  var buf = new _nodeForge2.default.util.ByteBuffer(typedVersion.buffer);
  return iota.utils.toTrytes(buf.bytes());
}