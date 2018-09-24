import IOTA from "iota.lib.js";

import ForgeCipher from "node-forge/lib/cipher";
import ForgeMd from "node-forge/lib/md";
import ForgeUtil from "node-forge/lib/util";

import { deriveNonce, genesisHash, hashChain } from "./utils/encryption";

const CURRENT_VERSION = 1;
const STOPPER_TRYTE = "A";
const IV_BYTE_LENGTH = 16;
const TAG_BYTE_LENGTH = 16;
const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;

export let iota = new IOTA();
const Forge = { cipher: ForgeCipher, md: ForgeMd, util: ForgeUtil };

export function bytesFromHandle(handle) {
  return Forge.md.sha256
    .create()
    .update(handle, "utf8")
    .digest();
}

export function s3FolderFromGenesisHash(genesisHash) {
  return Forge.md.sha256
    .create()
    .update(genesisHash)
    .digest()
    .toHex();
}

// Offset hashes for IXI Oyster.findGeneratedSignatures
// Pass genesisHash, absolute offset (0 = first file chunk)
// Alternatively pass last hash, relative offset, to save cycles
export function offsetHash(hashStr, offset) {
  let obfuscatedHash;
  let hash = Forge.util
    .createBuffer(Forge.util.binary.hex.decode(hashStr))
    .bytes();

  do {
    [obfuscatedHash, hash] = hashChain(hash);
  } while (offset-- > 0);

  return Forge.util.binary.hex.encode(hash);
}

export function addStopperTryte(trytes) {
  return trytes + STOPPER_TRYTE;
}

export function parseMessage(trytes) {
  return trytes.substring(0, trytes.lastIndexOf(STOPPER_TRYTE));
}

// Encryption to trytes
export function encrypt(key, iv, binaryString) {
  key.read = 0;
  const cipher = Forge.cipher.createCipher("AES-GCM", key);

  cipher.start({
    iv: iv,
    additionalData: "binary-encoded string",
    tagLength: TAG_BIT_LENGTH
  });

  cipher.update(binaryString);
  cipher.finish();

  const ivTrytes = iota.utils.toTrytes(iv);
  const tagTrytes = iota.utils.toTrytes(cipher.mode.tag.bytes());
  const trytes = iota.utils.toTrytes(cipher.output.bytes());

  return trytes + tagTrytes + ivTrytes;
}

export function encryptString(key, iv, string, encoding) {
  const buf = Forge.util.createBuffer(string, encoding || "utf8");
  return encrypt(key, iv, buf);
}

export function encryptBytes(key, iv, bytes) {
  return encrypt(key, iv, Forge.util.createBuffer(bytes));
}

export function encryptMetadata(metadata, key) {
  const iv = deriveNonce(key, 0);
  const trytes = encryptString(key, iv, JSON.stringify(metadata), "utf8");
  return addStopperTryte(versionTrytes() + trytes);
}

// Decryption from trytes
export function decrypt(key, byteBuffer) {
  key.read = 0;
  const byteStr = byteBuffer.bytes();
  const tag = byteStr.substr(
    -TAG_BYTE_LENGTH - IV_BYTE_LENGTH,
    TAG_BYTE_LENGTH
  );
  const iv = byteStr.substr(-IV_BYTE_LENGTH);
  const end = byteStr.length - TAG_BYTE_LENGTH - IV_BYTE_LENGTH;
  const msg = byteStr.substr(0, end);
  const decipher = Forge.cipher.createDecipher("AES-GCM", key);

  decipher.start({
    iv: iv,
    additionalData: "binary-encoded string",
    tagLength: TAG_BIT_LENGTH,
    tag
  });
  decipher.update(new Forge.util.ByteBuffer(msg, "binary"));

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}

export function decryptBytes(key, byteBuffer) {
  const output = decrypt(key, byteBuffer);
  if (output) {
    return Forge.util.binary.raw.decode(output.bytes());
  } else {
    return false;
  }
}

export function decryptString(key, byteBuffer, encoding) {
  const output = decrypt(key, byteBuffer);
  if (output) {
    return output.toString(encoding || "utf8");
  } else {
    return false;
  }
}

export function decryptMetadata(key, signature) {
  const trytes = parseMessage(signature);
  const byteStr = iota.utils.fromTrytes(trytes);
  const byteBuffer = Forge.util.createBuffer(byteStr, "binary");
  const version = getVersion(byteBuffer);
  const metadata = JSON.parse(decryptString(key, byteBuffer.compact()));

  return { version, metadata };
}

export function getVersion(byteBuffer) {
  const bytes = Forge.util.binary.raw.decode(byteBuffer.getBytes(4));
  return new DataView(bytes.buffer).getUint32(0);
}

export function versionTrytes() {
  const typedVersion = new DataView(new ArrayBuffer(4));
  typedVersion.setUint32(0, CURRENT_VERSION);
  const buf = new Forge.util.ByteBuffer(typedVersion.buffer);
  return iota.utils.toTrytes(buf.bytes());
}

export const validateKeys = (obj, keys) => {
  // TODO: Smarter validation.
  const invalidKeys = keys.filter(key => !obj.hasOwnProperty(key));

  if (invalidKeys.length > 0) {
    throw `Missing required keys: ${invalidKeys.join(", ")}`;
  }
};
