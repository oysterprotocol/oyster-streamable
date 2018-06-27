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

export function createUploadSession(
  filesize,
  genesisHash,
  numChunks,
  alpha,
  beta,
  epochs
) {
  return new Promise((resolve, reject) => {
    axiosInstance
      .post(`${alpha}${API.V2_UPLOAD_SESSIONS_PATH}`, {
        fileSizeBytes: filesize,
        numChunks,
        genesisHash,
        betaIp: beta,
        storageLengthInYears: epochs
      })
      .then(({ data }) => {
        const { id: alphaSessionId, betaSessionId } = data;
        const { invoice: invoice } = data;
        resolve({ alphaSessionId, betaSessionId, invoice });
      })
      .catch(error => {
        console.log("UPLOAD SESSION ERROR: ", error);
        reject(error);
      });
  });
}

// TODO: Delete helpers above.
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

const pollPaymentStatus = (host, sessId, statusFoundFn) => {
  return new Promise((resolve, reject) => {
    setInterval(() => {
      axiosInstance
        .get(`${host}${API.V2_UPLOAD_SESSIONS_PATH}/${sessid}`)
        .then(response => {
          const status = response.data.paymentStatus;
          if (statusFoundFn(status)) return resolve();
        })
        .catch(reject);
    }, POLL_INTERVAL);
  });
};

export const confirmPendingPoll = (host, sessId) =>
  pollPaymentStatus(
    host,
    sessId,
    status =>
      status === PAYMENT_STATUS.PENDING || status === PAYMENT_STATUS.CONFIRMED
  );

export const confirmPaidPoll = (host, sessId) =>
  pollPaymentStatus(
    host,
    sessId,
    status => status === PAYMENT_STATUS.CONFIRMED
  );
