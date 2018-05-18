import IOTA from 'iota.lib.js'
import Forge from 'node-forge'
import { genesisHash, hashChain } from './utils/encryption'
import axios from 'axios'

const STOPPER_TRYTE = 'A'
const IV_TRYTE_LENGTH = 32
const IV_BYTE_LENGTH = 16
const TAG_BYTE_LENGTH = 16
const TAG_BIT_LENGTH = TAG_BYTE_LENGTH * 8

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

export function addStopperTryte (trytes) {
  return trytes + STOPPER_TRYTE
}

export function parseMessage (trytes) {
  return trytes.substring(0, trytes.lastIndexOf(STOPPER_TRYTE))
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
    tagLength: TAG_BIT_LENGTH
  })

  cipher.update(binaryString)
  cipher.finish()

  const ivTrytes = iota.utils.toTrytes(iv)
  const tagTrytes = iota.utils.toTrytes(cipher.mode.tag.bytes())
  const trytes = iota.utils.toTrytes(cipher.output.bytes())

  return trytes + tagTrytes + ivTrytes
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
  const tag = byteStr.substr(-TAG_BYTE_LENGTH - IV_BYTE_LENGTH, TAG_BYTE_LENGTH)
  const iv = byteStr.substr(-IV_BYTE_LENGTH)
  const end = byteStr.length - TAG_BYTE_LENGTH - IV_BYTE_LENGTH
  const msg = byteStr.substr(0, end)
  const decipher = Forge.cipher.createDecipher('AES-GCM', key)

  decipher.start({
    iv: iv,
    additionalData: 'binary-encoded string',
    tagLength: TAG_BIT_LENGTH,
    tag
  })
  decipher.update(new Forge.util.ByteBuffer(msg, 'binary'))

  if(decipher.finish()) {
    return decipher.output
  } else {
    return false
  }
}

export function decryptBytes (key, byteBuffer) {
  const output = decrypt(key, byteBuffer)
  if(output) {
    return Forge.util.binary.raw.decode(output.bytes())
  } else {
    return false
  }
}

export function decryptString (key, byteBuffer, encoding) {
  const output = decrypt(key, byteBuffer)
  if(output) {
    return output.toString(encoding || 'utf8')
  } else {
    return false
  }
}
