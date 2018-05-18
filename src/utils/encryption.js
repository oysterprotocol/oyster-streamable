import Forge from 'node-forge'

// `length` should be a multiple of 2
export function getSalt (length) {
  const bytes = Forge.random.getBytesSync(Math.ceil(length / 2))
  return Forge.util.binary.hex.encode(bytes)
}

export function getPrimordialHash () {
  const bytes = Forge.random.getBytesSync(16)
  return Forge.md.sha256.create().update(bytes).digest().toHex()
}

// Returns [obfuscatedHash, nextHash]
export function hashChain (hash) {
  const obfuscatedHash = Forge.md.sha384.create().update(hash).digest().toHex()
  const nextHash = Forge.md.sha256.create().update(hash).digest().toHex()

  return [obfuscatedHash, nextHash]
}

// Genesis hash is not yet obfuscated.
export function genesisHash (handle) {
  const [_obfuscatedHash, genHash] = hashChain(handle);

  return genHash;
}

// Moved to Encryption utility
export function createHandle (filename) {
  const fileNameTrimmed = (filename + getSalt(8)).substr(0, 8)
  const salt = getSalt(8)
  const primordialHash = getPrimordialHash()
  const handle = fileNameTrimmed + primordialHash + salt

  return handle
}
