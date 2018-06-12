'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iota = undefined;
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

var _iotaLib = require('iota.lib.js');

var _iotaLib2 = _interopRequireDefault(_iotaLib);

var _nodeForge = require('node-forge');

var _nodeForge2 = _interopRequireDefault(_nodeForge);

var _encryption = require('./utils/encryption');

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CURRENT_VERSION = 1;
const STOPPER_TRYTE = 'A';
const IV_BYTE_LENGTH = 16;
const TAG_BYTE_LENGTH = 16;
const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;

let iota = exports.iota = new _iotaLib2.default();

function bytesFromHandle(handle) {
  return _nodeForge2.default.md.sha256.create().update(handle, 'utf8').digest();
}

// Offset hashes for IXI Oyster.findGeneratedSignatures
// Pass genesisHash, absolute offset (0 = first file chunk)
// Alternatively pass last hash, relative offset, to save cycles
function offsetHash(hashStr, offset) {
  let obfuscatedHash;
  let hash = _nodeForge2.default.util.createBuffer(_nodeForge2.default.util.binary.hex.decode(hashStr)).bytes();

  do {
    [obfuscatedHash, hash] = (0, _encryption.hashChain)(hash);
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
  const cipher = _nodeForge2.default.cipher.createCipher('AES-GCM', key);

  cipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: TAG_BIT_LENGTH
  });

  cipher.update(binaryString);
  cipher.finish();

  const ivTrytes = iota.utils.toTrytes(iv);
  const tagTrytes = iota.utils.toTrytes(cipher.mode.tag.bytes());
  const trytes = iota.utils.toTrytes(cipher.output.bytes());

  return trytes + tagTrytes + ivTrytes;
}

function encryptString(key, iv, string, encoding) {
  const buf = _nodeForge2.default.util.createBuffer(string, encoding || 'utf8');
  return encrypt(key, iv, buf);
}

function encryptBytes(key, iv, bytes) {
  return encrypt(key, iv, _nodeForge2.default.util.createBuffer(bytes));
}

function encryptMetadata(metadata, key) {
  const iv = (0, _encryption.deriveNonce)(key, 0);
  const trytes = encryptString(key, iv, JSON.stringify(metadata), 'utf8');
  return addStopperTryte(versionTrytes() + trytes);
}

// Decryption from trytes
function decrypt(key, byteBuffer) {
  key.read = 0;
  const byteStr = byteBuffer.bytes();
  const tag = byteStr.substr(-TAG_BYTE_LENGTH - IV_BYTE_LENGTH, TAG_BYTE_LENGTH);
  const iv = byteStr.substr(-IV_BYTE_LENGTH);
  const end = byteStr.length - TAG_BYTE_LENGTH - IV_BYTE_LENGTH;
  const msg = byteStr.substr(0, end);
  const decipher = _nodeForge2.default.cipher.createDecipher('AES-GCM', key);

  decipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: TAG_BIT_LENGTH,
    tag
  });
  decipher.update(new _nodeForge2.default.util.ByteBuffer(msg, 'binary'));

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}

function decryptBytes(key, byteBuffer) {
  const output = decrypt(key, byteBuffer);
  if (output) {
    return _nodeForge2.default.util.binary.raw.decode(output.bytes());
  } else {
    return false;
  }
}

function decryptString(key, byteBuffer, encoding) {
  const output = decrypt(key, byteBuffer);
  if (output) {
    return output.toString(encoding || 'utf8');
  } else {
    return false;
  }
}

function decryptMetadata(key, signature) {
  const trytes = parseMessage(signature);
  const byteStr = iota.utils.fromTrytes(trytes);
  const byteBuffer = _nodeForge2.default.util.createBuffer(byteStr, 'binary');
  const version = getVersion(byteBuffer);
  const metadata = JSON.parse(decryptString(key, byteBuffer.compact()));

  return { version, metadata };
}

function getVersion(byteBuffer) {
  const bytes = _nodeForge2.default.util.binary.raw.decode(byteBuffer.getBytes(4));
  return new DataView(bytes.buffer).getUint32(0);
}

function versionTrytes() {
  const typedVersion = new DataView(new ArrayBuffer(4));
  typedVersion.setUint32(0, CURRENT_VERSION);
  const buf = new _nodeForge2.default.util.ByteBuffer(typedVersion.buffer);
  return iota.utils.toTrytes(buf.bytes());
}