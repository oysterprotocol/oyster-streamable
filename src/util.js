import IOTA from 'iota.lib.js'
import Forge from 'node-forge'
import { genesisHash, hashChain } from './utils/encryption'

const IV_TRYTE_LENGTH = 32
const iota = new IOTA()

export function bytesFromHandle (handle) {
  return Forge.md.sha256.create().update(handle).digest()
}

// Offset hashes for IXI Oyster.findGeneratedSignatures
// Pass genesisHash, absolute offset (0 = first file chunk)
// Alternatively pass last hash, relative offset, to save cycles
export function offsetHash (hash, offset) {
  let obfuscatedHash

  do {
    [obfuscatedHash, hash] = hashChain(hash)
  } while(offset-- > 0)

  return hash
}

export function parseMessage (message) {
  const characters = message.split("");
  const notNineIndex = _.findLastIndex(characters, c => c !== "9");

  const choppedArray = characters.slice(0, notNineIndex + 1);
  const choppedMessage = choppedArray.join("");

  const evenChars =
    choppedMessage.length % 2 === 0 ? choppedMessage : choppedMessage + "9";

  return evenChars;
}

// Query transactions signatures with IXI Oyster.findGeneratedSignatures
export function queryGeneratedSignatures (iotaProvider, hash, count) {
  return new Promise((resolve, reject) => {
    const data = {
      command: 'Oyster.findGeneratedSignatures',
      hash: hash,
      count: count
    }

    iotaProvider.api.sendCommand(data, (error, result) => {
      if(error) {
        return reject(error)
      }

      const signatures = result.ixi.signatures || []

      if(count !== signatures.length) {
        return reject("Input and output mismatch")
      }

      resolve(signatures)
    })
  })
}

// Encryption to trytes
export function encrypt(key, binaryString) {
  key.read = 0
  const iv = Forge.random.getBytesSync(16)
  const cipher = Forge.cipher.createCipher('AES-GCM', key)

  cipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: 128
  })

  cipher.update(binaryString)
  cipher.finish()

  const ivTrytes = iota.utils.toTrytes(iv)
  const trytes = iota.utils.toTrytes(cipher.output.getBytes())

  return trytes + ivTrytes
}

export function encryptString(key, string, encoding) {
  return encrypt(key, Forge.util.createBuffer(string, encoding || 'utf8'))
}

export function encryptBytes (key, bytes) {
  return encrypt(key, Forge.util.createBuffer(bytes))
}

// Decryption from trytes
export function decrypt (key, trytes) {
  key.read = 0
  const iv = iota.utils.fromTrytes(trytes.substr(-IV_TRYTE_LENGTH))
  const end = trytes.length - IV_TRYTE_LENGTH
  const msg = trytes.substr(0, end)
  const encrypted = iota.utils.fromTrytes(msg)
  const decipher = Forge.cipher.createDecipher('AES-GCM', key)
  decipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: 0
  })
  decipher.update(Forge.util.createBuffer(encrypted), 'binary')
  const pass = decipher.finish()

  return decipher.output
}

export function decryptBytes (key, trytes) {
  return Forge.util.binary.raw.decode(decrypt(key, trytes).getBytes())
}

export function decryptString (key, trytes, encoding) {
  return decrypt(key, trytes).toString(encoding || 'utf8')
}
