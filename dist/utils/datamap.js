"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generate = generate;
exports.offsetHash = offsetHash;

var _encryption = require("./encryption");

var _util = require("../util");

var _config = require("./config");

function generate(handle, size, opts = {}) {
  let offsets = 1; // Meta chunk

  if (opts.includeTreasureOffsets) {
    // Includes 1 treasure per sector.
    const numTreasureChunks = Math.ceil(size / (_config.FILE.CHUNKS_PER_SECTOR - 1));
    offsets += numTreasureChunks;
  }

  const keys = Array.from(Array(size + offsets), (_, i) => i);

  const [dataMap] = keys.reduce(([dataM, hash], i) => {
    const [obfuscatedHash, nextHash] = (0, _encryption.hashChain)(hash);
    dataM[i] = _util.iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
    return [dataM, nextHash];
  }, [{}, (0, _encryption.genesisHash)(handle)]);
  return dataMap;
};

function offsetHash(hash, offset) {
  let nextHash = hash;

  do {
    const [obfuscatedHash, nextHash] = (0, _encryption.hashChain)(nextHash);
  } while (--offset > 0);

  return _util.iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
}