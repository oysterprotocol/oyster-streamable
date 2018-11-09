import axios from "axios";
import { API, IOTA_API } from "../config";

const CURRENT_VERSION = 1;
const SESSIONS_PATH = API.V2_UPLOAD_SESSIONS_PATH;

axios.defaults.timeout = 60000;

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
      responseType: binary ? "arraybuffer" : "json",
      headers: { "X-IOTA-API-Version": "1" }
    };

    axios
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
      .catch(reject);
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
    axios
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
      .catch(reject);
  });
}

export function sendToBroker(broker, sessId, chunks) {
  const endpoint = `${broker}${SESSIONS_PATH}/${sessId}`;
  return sendChunksToBroker(endpoint, chunks);
}

export function sendChunksToBroker(brokerUrl, chunks) {
  return new Promise((resolve, reject) => {
    axios
      .put(brokerUrl, { chunks })
      .then(response => resolve(response))
      .catch(reject);
  });
}

export function signTreasures(
  alphaData,
  betaData,
  handle,
  unsignedTreasurePath,
  signedTreasurePath
) {
  let alphaUnsignedTreasures = getUnsignedTreasure(
    alphaData.broker,
    alphaData.sessionID,
    unsignedTreasurePath
  );
  let betaUnsignedTreasures = getUnsignedTreasure(
    betaData.broker,
    betaData.sessionID,
    unsignedTreasurePath
  );

  // make some calls to do some treasure signing logic
  // this is all just dummy data

  if (alphaUnsignedTreasures.available) {
    let alphaTreasure = [];
    for (let i = 0; i < alphaUnsignedTreasures.unsignedTreasure.length; i++) {
      alphaTreasure.push("SOMETREASURE");
    }
    let payload = {
      signedTreasure: alphaTreasure
    };
    debugger;
    return setSignedTreasures(
      alphaData.broker,
      alphaData.sessionID,
      signedTreasurePath,
      payload
    );
  }
  if (betaUnsignedTreasures.available) {
    let betaTreasure = [];
    for (let i = 0; i < betaUnsignedTreasures.unsignedTreasure.length; i++) {
      betaTreasure.push("SOMETREASURE");
    }
    let payload = {
      signedTreasure: betaTreasure
    };

    debugger;

    return setSignedTreasures(
      betaData.broker,
      betaData.sessionID,
      signedTreasurePath,
      payload
    );
  }

  debugger;

  // I guess this gets called if both brokers are in dummy mode?
  return new Promise(resolve => {
    resolve();
  });
}

export function getUnsignedTreasure(broker, sessId, unsignedTreasurePath) {
  const endpoint = `${broker}${unsignedTreasurePath}/${sessId}`;
  return new Promise((resolve, reject) => {
    axios
      .get(endpoint)
      .then(response => resolve(response))
      .catch(reject);
  });
}

export function setSignedTreasures(
  broker,
  sessId,
  signedTreasurePath,
  signedTreasures
) {
  const endpoint = `${broker}${signedTreasurePath}/${sessId}`;
  return new Promise((resolve, reject) => {
    axios
      .put(endpoint, { signedTreasures })
      .then(response => resolve(response))
      .catch(reject);
  });
}

// TODO: Make these configurable?
const POLL_INTERVAL = 4000;
const PAYMENT_STATUS = Object.freeze({
  INVOICED: "invoiced",
  PENDING: "pending",
  CONFIRMED: "confirmed"
});

const setIntervalAndExecute = (fn, t) => {
  fn();
  return setInterval(fn, t);
};

/*
 * Payment polling
 */

const pollPaymentStatus = (host, sessId, statusFoundFn) => {
  return new Promise((resolve, reject) => {
    const poll = setIntervalAndExecute(() => {
      axios
        .get(`${host}${API.V2_UPLOAD_SESSIONS_PATH}/${sessId}`)
        .then(response => {
          const status = response.data.paymentStatus;

          if (statusFoundFn(status)) {
            clearInterval(poll);
            return resolve();
          }
        })
        .catch(err => {
          clearInterval(poll);
          return reject(err);
        });
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
