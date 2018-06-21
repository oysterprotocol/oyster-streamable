import axios from "axios";
import FileProcessor from "./file-processor";
import Encryption from "./encryption";
import { API, IOTA_API } from "../config";

const CURRENT_VERSION = 1;
const SESSIONS_PATH = API.V2_UPLOAD_SESSIONS_PATH;

const axiosInstance = axios.create({
  timeout: 200000
});

export function queryGeneratedSignatures(
  iotaProvider,
  hash,
  count,
  binary = false
) {
  return new Promise((resolve, reject) => {
    const data = {
      command: "Oyster.findGeneratedSignatures",
      version: CURRENT_VERSION,
      hash,
      count,
      binary
    };

    const opts = {
      timeout: 5000,
      responseType: binary ? "arraybuffer" : "json",
      headers: { "X-IOTA-API-Version": "1" }
    };

    axiosInstance
      .post(iotaProvider.provider, data, opts)
      .then(response => {
        if (response.status !== 200) {
          throw `Request failed (${response.status}) ${response.statusText}`;
        }

        if (response.headers["content-type"] === "application/octet-stream") {
          resolve({
            isBinary: true,
            data: response.data
          });
        } else {
          resolve({
            isBinary: false,
            data: response.data.ixi.signatures || []
          });
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function createUploadSession(filesize, genesisHash, numChunks, epochs) {
  return new Promise((resolve, reject) => {
    const host = API.BROKER_NODE_A;
    axiosInstance
      .post(`${host}${API.V2_UPLOAD_SESSIONS_PATH}`, {
        fileSizeBytes: filesize,
        numChunks,
        genesisHash,
        betaIp: API.BROKER_NODE_B,
        storageLengthInYears: epochs
      })
      .then(({ data }) => {
        const { id: alphaSessionId, betaSessionId } = data;
        const { invoice: invoice } = data;
        resolve({ alphaSessionId, betaSessionId, invoice, host });
      })
      .catch(error => {
        console.log("UPLOAD SESSION ERROR: ", error);
        reject(error);
      });
  });
}

export function sendToBrokers(sessIdA, sessIdB, chunks) {
  return Promise.all([
    sendToBroker(API.BROKER_NODE_A, sessIdA, chunks),
    sendToBroker(API.BROKER_NODE_B, sessIdB, chunks.slice().reverse())
  ]);
}

export function sendToBrokerA(sessId, chunks) {
  return sendToBroker(API.BROKER_NODE_A, sessId, chunks);
}

export function sendToBrokerB(sessId, chunks) {
  return sendToBroker(API.BROKER_NODE_B, sessId, chunks);
}

export function sendToBroker(broker, sessId, chunks) {
  const endpoint = `${broker}${SESSIONS_PATH}/${sessId}`;
  return sendChunksToBroker(endpoint, chunks);
}

export function sendChunksToBroker(brokerUrl, chunks) {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(brokerUrl, { chunks })
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        console.log("ERROR SENDING CHUNK TO BROKER:", error);
        reject(error);
      });
  });
}

// TODO: Make these configurable?
const POLL_INTERVAL = 4000;
const PAYMENT_STATUS = Object.freeze({
  INVOICED: "invoiced",
  PENDING: "pending",
  CONFIRMED: "confirmed"
});

export const confirmPaidPoll = (host, sessId) => {
  return new Promise((resolve, reject) => {
    setInterval(() => {
      axiosInstance
        .get(`${host}${API.V2_UPLOAD_SESSIONS_PATH}/${sessid}`)
        .then(response => {
          const status = response.data.paymentStatus;
          if (status === PAYMENT_STATUS.CONFIRMED) return resolve();
        })
        .catch(reject);
    }, POLL_INTERVAL);
  });
};
