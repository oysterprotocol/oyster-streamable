import IOTA from 'iota.lib.js'
import Forge from 'node-forge'

const IV_TRYTE_LENGTH = 32
const iota = new IOTA()

export function bytesFromHandle (handle) {
  // return Forge.md.sha256.create().update(handle).digest()
  return Forge.util.createBuffer(Forge.util.hexToBytes(handle), 'binary')
}

export function encryptBytes (key, bytes) {
  key.read = 0
  const iv = Forge.random.getBytesSync(16);
  const cipher = Forge.cipher.createCipher('AES-GCM', key);

  cipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: 128
  })

  cipher.update(Forge.util.createBuffer(bytes))
  cipher.finish()

  const ivTrytes = iota.utils.toTrytes(iv)
  const trytes = iota.utils.toTrytes(cipher.output.getBytes())

  return trytes + ivTrytes
}

export function decryptBytes (key, trytes) {
  key.read = 0
  const iv = iota.utils.fromTrytes(trytes.substr(-IV_TRYTE_LENGTH))
  const end = trytes.length - IV_TRYTE_LENGTH
  const encrypted = iota.utils.fromTrytes(trytes.substr(0, end))

  // decrypt some bytes using GCM mode
  const decipher = Forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: 0
  });
  decipher.update(Forge.util.createBuffer(encrypted), 'binary');
  const pass = decipher.finish();

  return Forge.util.binary.raw.decode(decipher.output.getBytes())
}
