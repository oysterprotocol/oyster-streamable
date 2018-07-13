var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import Forge from "node-forge";

var IV_BYTE_LENGTH = 16;

export function getSalt(length) {
  var bytes = Forge.random.getBytesSync(length);
  var byteArr = Forge.util.binary.raw.decode(bytes);
  var salt = Forge.util.binary.base58.encode(byteArr);
  return salt.substr(0, length);
}

export function getPrimordialHash() {
  var bytes = Forge.random.getBytesSync(16);
  return Forge.md.sha256.create().update(bytes).digest().toHex();
}

export function deriveNonce(key, idx) {
  var nonce = Forge.util.binary.hex.decode(idx.toString(16));
  return Forge.md.sha384.create().update(key.bytes()).update(nonce).digest().getBytes(IV_BYTE_LENGTH);
}

// Returns [obfuscatedHash, nextHash]
export function hashChain(byteStr) {
  var obfuscatedHash = Forge.md.sha384.create().update(byteStr).digest().bytes();
  var nextHash = Forge.md.sha256.create().update(byteStr).digest().bytes();

  return [obfuscatedHash, nextHash];
}

// Genesis hash is not yet obfuscated.
export function genesisHash(handle) {
  var primordialHash = handle.substr(8, 64);
  var byteStr = Forge.util.hexToBytes(primordialHash);

  var _hashChain = hashChain(byteStr),
      _hashChain2 = _slicedToArray(_hashChain, 2),
      _obfuscatedHash = _hashChain2[0],
      genHash = _hashChain2[1];

  return Forge.util.bytesToHex(genHash);
}

// First hash in the datamap
export function obfuscatedGenesisHash(hash) {
  var byteStr = Forge.util.hexToBytes(hash);

  var _hashChain3 = hashChain(byteStr),
      _hashChain4 = _slicedToArray(_hashChain3, 2),
      obfuscatedHash = _hashChain4[0],
      _genHash = _hashChain4[1];

  return Forge.util.bytesToHex(obfuscatedHash);
}

// Moved to Encryption utility
export function createHandle(filename) {
  var safeFilename = filename.replace(/\W/g, "");
  var prefix = (safeFilename + getSalt(8)).substr(0, 8);
  var suffix = getSalt(8);
  var primordialHash = getPrimordialHash();

  return prefix + primordialHash + suffix;
}