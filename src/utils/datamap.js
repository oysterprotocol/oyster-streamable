import * as encryption from "./encryption";

import { iota } from "../util";
import { FILE } from "../config";
import util from "node-forge/lib/util";

export function generate(handle, size) {
  let offsets = 1; // Meta chunk

  // Includes 1 treasure per sector.
  const numTreasureChunks = Math.ceil(size / (FILE.CHUNKS_PER_SECTOR - 1));
  offsets += numTreasureChunks;

  const keys = Array.from(Array(size + offsets), (_, i) => i);

  const [dataMap] = keys.reduce(
    ([dataM, hash], i) => {
      const [obfuscatedHash, nextHash] = encryption.hashChain(hash);
      dataM[i] = iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
      return [dataM, nextHash];
    },
    [{}, encryption.genesisHash(handle)]
  );
  return dataMap;
}

export function offsetHash(hash, offset) {
  let nextHash = hash;
  let obfuscatedHash;

  do {
    [obfuscatedHash, nextHash] = encryption.hashChain(nextHash);
  } while (--offset > 0);

  return iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
}

export function getNextHash(hash) {
  let hashChain = encryption.hashChain(util.hexToBytes(hash));
  return util.bytesToHex(hashChain[1]);
}
