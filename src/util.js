import IOTA from 'iota.lib.js'
import Forge from 'node-forge'
import { genesisHash, hashChain } from './utils/encryption'
import axios from 'axios'

const IV_TRYTE_LENGTH = 32
const IV_BYTE_LENGTH = 16

export let iota = new IOTA();

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

export function queryGeneratedSignatures (iotaProvider, hash, count, binary = false) {
  return new Promise((resolve, reject) => {
    const data = {
      command: 'Oyster.findGeneratedSignatures',
      hash,
      count,
      binary
    }

    const opts = {
      timeout: 5000,
      responseType: binary ? 'arraybuffer' : 'json',
      headers: {'X-IOTA-API-Version': '1'}
    }

    axios.post(iotaProvider.provider, data, opts).then(response => {
      if(response.status !== 200) {
        throw(`Request failed (${response.status}) ${response.statusText}`)
      }

      if (response.headers['content-type'] === 'application/octet-stream') {
        resolve({
          isBinary: true,
          data: response.data
        })
      } else {
        resolve({
          isBinary: false,
          data: response.data.ixi.signatures || []
        })
      }
    })
  })
}

// Encryption to trytes
export function encrypt(key, binaryString) {
  key.read = 0
  const iv = Forge.random.getBytesSync(IV_BYTE_LENGTH)
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
export function decrypt (key, byteBuffer) {
  key.read = 0
  const byteStr = byteBuffer.bytes()
  const iv = byteStr.substr(-IV_BYTE_LENGTH)
  const end = byteStr.length - IV_BYTE_LENGTH
  const msg = byteStr.substr(0, end)
  const decipher = Forge.cipher.createDecipher('AES-GCM', key)

  decipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: 0
  })
  decipher.update(new Forge.util.ByteBuffer(msg, 'binary'))
  const pass = decipher.finish()

  return decipher.output
}

export function decryptBytes (key, byteBuffer) {
  return Forge.util.binary.raw.decode(decrypt(key, byteBuffer).bytes())
}

export function decryptString (key, byteBuffer, encoding) {
  return decrypt(key, byteBuffer).toString(encoding || 'utf8')
}
