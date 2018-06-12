'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSalt = getSalt;
exports.getPrimordialHash = getPrimordialHash;
exports.deriveNonce = deriveNonce;
exports.hashChain = hashChain;
exports.genesisHash = genesisHash;
exports.obfuscatedGenesisHash = obfuscatedGenesisHash;
exports.createHandle = createHandle;

var _nodeForge = require('node-forge');

var _nodeForge2 = _interopRequireDefault(_nodeForge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const IV_BYTE_LENGTH = 16;

function getSalt(length) {
  const bytes = _nodeForge2.default.random.getBytesSync(length);
  const byteArr = _nodeForge2.default.util.binary.raw.decode(bytes);
  const salt = _nodeForge2.default.util.binary.base58.encode(byteArr);
  return salt.substr(0, length);
}

function getPrimordialHash() {
  const bytes = _nodeForge2.default.random.getBytesSync(16);
  return _nodeForge2.default.md.sha256.create().update(bytes).digest().toHex();
}

function deriveNonce(key, idx) {
  const nonce = _nodeForge2.default.util.binary.hex.decode(idx.toString(16));
  return _nodeForge2.default.md.sha384.create().update(key.bytes()).update(nonce).digest().getBytes(IV_BYTE_LENGTH);
}

// Returns [obfuscatedHash, nextHash]
function hashChain(byteStr) {
  const obfuscatedHash = _nodeForge2.default.md.sha384.create().update(byteStr).digest().bytes();
  const nextHash = _nodeForge2.default.md.sha256.create().update(byteStr).digest().bytes();

  return [obfuscatedHash, nextHash];
}

// Genesis hash is not yet obfuscated.
function genesisHash(handle) {
  const primordialHash = handle.substr(8, 64);
  const byteStr = _nodeForge2.default.util.hexToBytes(primordialHash);
  const [_obfuscatedHash, genHash] = hashChain(byteStr);
  return _nodeForge2.default.util.bytesToHex(genHash);
}

// First hash in the datamap
function obfuscatedGenesisHash(hash) {
  const byteStr = _nodeForge2.default.util.hexToBytes(hash);
  const [obfuscatedHash, _genHash] = hashChain(byteStr);

  return _nodeForge2.default.util.bytesToHex(obfuscatedHash);
}

// Moved to Encryption utility
function createHandle(filename) {
  const safeFilename = filename.replace(/\W/g, '');
  const prefix = (safeFilename + getSalt(8)).substr(0, 8);
  const suffix = getSalt(8);
  const primordialHash = getPrimordialHash();

  return prefix + primordialHash + suffix;
}