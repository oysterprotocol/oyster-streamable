"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getSalt = getSalt;
exports.getPrimordialHash = getPrimordialHash;
exports.deriveNonce = deriveNonce;
exports.hashChain = hashChain;
exports.genesisHash = genesisHash;
exports.obfuscatedGenesisHash = obfuscatedGenesisHash;
exports.createHandle = createHandle;

var _md = require("node-forge/lib/md");

var _md2 = _interopRequireDefault(_md);

var _random = require("node-forge/lib/random");

var _random2 = _interopRequireDefault(_random);

var _util = require("node-forge/lib/util");

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IV_BYTE_LENGTH = 16;

function getSalt(length) {
  var bytes = _random2.default.getBytesSync(length);
  var byteArr = _util2.default.binary.raw.decode(bytes);
  var salt = _util2.default.binary.base58.encode(byteArr);
  return salt.substr(0, length);
}

function getPrimordialHash() {
  var bytes = _random2.default.getBytesSync(16);
  return _md2.default.sha256.create().update(bytes).digest().toHex();
}

function deriveNonce(key, idx) {
  var nonce = _util2.default.binary.hex.decode(idx.toString(16));
  return _md2.default.sha384.create().update(key.bytes()).update(nonce).digest().getBytes(IV_BYTE_LENGTH);
}

// Returns [obfuscatedHash, nextHash]
function hashChain(byteStr) {
  var obfuscatedHash = _md2.default.sha384.create().update(byteStr).digest().bytes();
  var nextHash = _md2.default.sha256.create().update(byteStr).digest().bytes();

  return [obfuscatedHash, nextHash];
}

// Genesis hash is not yet obfuscated.
function genesisHash(handle) {
  var primordialHash = handle.substr(8, 64);
  var byteStr = _util2.default.hexToBytes(primordialHash);

  var _hashChain = hashChain(byteStr),
      _hashChain2 = _slicedToArray(_hashChain, 2),
      _obfuscatedHash = _hashChain2[0],
      genHash = _hashChain2[1];

  return _util2.default.bytesToHex(genHash);
}

// First hash in the datamap
function obfuscatedGenesisHash(hash) {
  var byteStr = _util2.default.hexToBytes(hash);

  var _hashChain3 = hashChain(byteStr),
      _hashChain4 = _slicedToArray(_hashChain3, 2),
      obfuscatedHash = _hashChain4[0],
      _genHash = _hashChain4[1];

  return _util2.default.bytesToHex(obfuscatedHash);
}

// Moved to Encryption utility
function createHandle(filename) {
  var safeFilename = filename.replace(/\W/g, "");
  var prefix = (safeFilename + getSalt(8)).substr(0, 8);
  var suffix = getSalt(8);
  var primordialHash = getPrimordialHash();

  return prefix + primordialHash + suffix;
}