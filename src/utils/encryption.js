import md from "node-forge/lib/md";
import random from "node-forge/lib/random";
import util from "node-forge/lib/util";

const IV_BYTE_LENGTH = 16;

export function getSalt(length) {
  const bytes = random.getBytesSync(length);
  const byteArr = util.binary.raw.decode(bytes);
  const salt = util.binary.base58.encode(byteArr);
  return salt.substr(0, length);
}

export function getPrimordialHash() {
  const bytes = random.getBytesSync(16);
  return md.sha256
    .create()
    .update(bytes)
    .digest()
    .toHex();
}

export function deriveNonce(key, idx) {
  const nonce = util.binary.hex.decode(idx.toString(16));
  return md.sha384
    .create()
    .update(key.bytes())
    .update(nonce)
    .digest()
    .getBytes(IV_BYTE_LENGTH);
}

// Returns [obfuscatedHash, nextHash]
export function hashChain(byteStr) {
  const obfuscatedHash = md.sha384
    .create()
    .update(byteStr)
    .digest()
    .bytes();
  const nextHash = md.sha256
    .create()
    .update(byteStr)
    .digest()
    .bytes();

  return [obfuscatedHash, nextHash];
}

// Genesis hash is not yet obfuscated.
export function genesisHash(handle) {
  const primordialHash = handle.substr(8, 64);
  const byteStr = util.hexToBytes(primordialHash);
  const [_obfuscatedHash, genHash] = hashChain(byteStr);
  return util.bytesToHex(genHash);
}

// First hash in the datamap
export function obfuscatedGenesisHash(hash) {
  const byteStr = util.hexToBytes(hash);
  const [obfuscatedHash, _genHash] = hashChain(byteStr);

  return util.bytesToHex(obfuscatedHash);
}

// Moved to Encryption utility
export function createHandle(filename) {
  const safeFilename = filename.replace(/\W/g, "");
  const prefix = (safeFilename + getSalt(8)).substr(0, 8);
  const suffix = getSalt(8);
  const primordialHash = getPrimordialHash();

  return prefix + primordialHash + suffix;
}
