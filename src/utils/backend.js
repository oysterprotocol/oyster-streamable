import axios from "axios"
import FileProcessor from "./file-processor"
import Encryption from "./encryption"
import { API, IOTA_API } from "../config"

const SESSIONS_PATH = API.V2_UPLOAD_SESSIONS_PATH

const axiosInstance = axios.create({
  timeout: 200000
})

export function createUploadSession (
  filesize,
  genesisHash,
  numChunks,
  epochs
) {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`${API.BROKER_NODE_A}${API.V2_UPLOAD_SESSIONS_PATH}`, {
        fileSizeBytes: filesize,
        numChunks,
        genesisHash,
        betaIp: API.BROKER_NODE_B,
        storageLengthInYears: epochs
      })
      .then(({ data }) => {
        const { id: alphaSessionId, betaSessionId } = data
        const { invoice: invoice } = data
        resolve({ alphaSessionId, betaSessionId, invoice })
      })
      .catch(error => {
        console.log("UPLOAD SESSION ERROR: ", error)
        reject(error)
      })
  })
}

export function sendToBrokers (sessIdA, sessIdB, chunks) {
  return Promise.all([
    sendToBroker(API.BROKER_NODE_A, sessIdA, chunks),
    sendToBroker(API.BROKER_NODE_B, sessIdB, [...chunks].reverse())
  ])
}

export function sendToBroker (broker, sessId, chunks) {
  const endpoint = `${broker}${SESSIONS_PATH}/${sessId}`
  return sendChunksToBroker(endpoint, chunks)
}

export function sendChunksToBroker (brokerUrl, chunks) {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(brokerUrl, { chunks })
      .then(response => {
        resolve(response)
      })
      .catch(error => {
        console.log("ERROR SENDING CHUNK TO BROKER:", error)
        reject(error)
      })
  })
}

