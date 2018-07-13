var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import IOTA from "iota.lib.js";
import Forge from "node-forge";
import { deriveNonce, genesisHash, hashChain } from "./utils/encryption";

var CURRENT_VERSION = 1;
var STOPPER_TRYTE = "A";
var IV_BYTE_LENGTH = 16;
var TAG_BYTE_LENGTH = 16;
var TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8;

export var iota = new IOTA();

export function bytesFromHandle(handle) {
  return Forge.md.sha256.create().update(handle, "utf8").digest();
}

// Offset hashes for IXI Oyster.findGeneratedSignatures
// Pass genesisHash, absolute offset (0 = first file chunk)
// Alternatively pass last hash, relative offset, to save cycles
export function offsetHash(hashStr, offset) {
  var obfuscatedHash = void 0;
  var hash = Forge.util.createBuffer(Forge.util.binary.hex.decode(hashStr)).bytes();

  do {
    var _hashChain = hashChain(hash);

    var _hashChain2 = _slicedToArray(_hashChain, 2);

    obfuscatedHash = _hashChain2[0];
    hash = _hashChain2[1];
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
  var cipher = Forge.cipher.createCipher("AES-GCM", key);

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

export function encryptString(key, iv, string, encoding) {
  var buf = Forge.util.createBuffer(string, encoding || "utf8");
  return encrypt(key, iv, buf);
}

export function encryptBytes(key, iv, bytes) {
  return encrypt(key, iv, Forge.util.createBuffer(bytes));
}

export function encryptMetadata(metadata, key) {
  var iv = deriveNonce(key, 0);
  var trytes = encryptString(key, iv, JSON.stringify(metadata), "utf8");
  return addStopperTryte(versionTrytes() + trytes);
}

// Decryption from trytes
export function decrypt(key, byteBuffer) {
  key.read = 0;
  var byteStr = byteBuffer.bytes();
  var tag = byteStr.substr(-TAG_BYTE_LENGTH - IV_BYTE_LENGTH, TAG_BYTE_LENGTH);
  var iv = byteStr.substr(-IV_BYTE_LENGTH);
  var end = byteStr.length - TAG_BYTE_LENGTH - IV_BYTE_LENGTH;
  var msg = byteStr.substr(0, end);
  var decipher = Forge.cipher.createDecipher("AES-GCM", key);

  decipher.start({
    iv: iv,
    additionalData: "binary-encoded string",
    tagLength: TAG_BIT_LENGTH,
    tag: tag
  });
  decipher.update(new Forge.util.ByteBuffer(msg, "binary"));

  if (decipher.finish()) {
    return decipher.output;
  } else {
    return false;
  }
}

export function decryptBytes(key, byteBuffer) {
  var output = decrypt(key, byteBuffer);
  if (output) {
    return Forge.util.binary.raw.decode(output.bytes());
  } else {
    return false;
  }
}

export function decryptString(key, byteBuffer, encoding) {
  var output = decrypt(key, byteBuffer);
  if (output) {
    return output.toString(encoding || "utf8");
  } else {
    return false;
  }
}

export function decryptMetadata(key, signature) {
  var trytes = parseMessage(signature);
  var byteStr = iota.utils.fromTrytes(trytes);
  var byteBuffer = Forge.util.createBuffer(byteStr, "binary");
  var version = getVersion(byteBuffer);
  var metadata = JSON.parse(decryptString(key, byteBuffer.compact()));

  return { version: version, metadata: metadata };
}

export function getVersion(byteBuffer) {
  var bytes = Forge.util.binary.raw.decode(byteBuffer.getBytes(4));
  return new DataView(bytes.buffer).getUint32(0);
}

export function versionTrytes() {
  var typedVersion = new DataView(new ArrayBuffer(4));
  typedVersion.setUint32(0, CURRENT_VERSION);
  var buf = new Forge.util.ByteBuffer(typedVersion.buffer);
  return iota.utils.toTrytes(buf.bytes());
}