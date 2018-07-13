import axios from "axios";
import { API, IOTA_API } from "../config";

var CURRENT_VERSION = 1;
var SESSIONS_PATH = API.V2_UPLOAD_SESSIONS_PATH;

var axiosInstance = axios.create({ timeout: 200000 });

export function queryGeneratedSignatures(iotaProvider, hash, count) {
  var binary = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  return new Promise(function (resolve, reject) {
    var data = {
      command: "Oyster.findGeneratedSignatures",
      version: CURRENT_VERSION,
      hash: hash,
      count: count,
      binary: binary
    };

    var opts = {
      timeout: 5000,
      responseType: binary ? "arraybuffer" : "json",
      headers: { "X-IOTA-API-Version": "1" }
    };

    axiosInstance.post(iotaProvider.provider, data, opts).then(function (response) {
      if (response.status !== 200) {
        throw "Request failed (" + response.status + ") " + response.statusText;
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
    }).catch(function (error) {
      reject(error);
    });
  });
}

export function createUploadSession(filesize, genesisHash, numChunks, alpha, beta, epochs) {
  return new Promise(function (resolve, reject) {
    axiosInstance.post("" + alpha + API.V2_UPLOAD_SESSIONS_PATH, {
      fileSizeBytes: filesize,
      numChunks: numChunks,
      genesisHash: genesisHash,
      betaIp: beta,
      storageLengthInYears: epochs
    }).then(function (_ref) {
      var data = _ref.data;
      var alphaSessionId = data.id,
          betaSessionId = data.betaSessionId;
      var invoice = data.invoice;

      resolve({ alphaSessionId: alphaSessionId, betaSessionId: betaSessionId, invoice: invoice });
    }).catch(function (error) {
      console.log("UPLOAD SESSION ERROR: ", error);
      reject(error);
    });
  });
}

export function sendToBroker(broker, sessId, chunks) {
  var endpoint = "" + broker + SESSIONS_PATH + "/" + sessId;
  return sendChunksToBroker(endpoint, chunks);
}

export function sendChunksToBroker(brokerUrl, chunks) {
  return new Promise(function (resolve, reject) {
    axiosInstance.put(brokerUrl, { chunks: chunks }).then(function (response) {
      return resolve(response);
    }).catch(function (error) {
      console.log("ERROR SENDING CHUNK TO BROKER:", error);
      reject(error);
    });
  });
}

// TODO: Make these configurable?
var POLL_INTERVAL = 4000;
var PAYMENT_STATUS = Object.freeze({
  INVOICED: "invoiced",
  PENDING: "pending",
  CONFIRMED: "confirmed"
});

var setIntervalAndExecute = function setIntervalAndExecute(fn, t) {
  fn();
  return setInterval(fn, t);
};

/**
 * Payment polling
 */

var pollPaymentStatus = function pollPaymentStatus(host, sessId, statusFoundFn) {
  return new Promise(function (resolve, reject) {
    var poll = setIntervalAndExecute(function () {
      axiosInstance.get("" + host + API.V2_UPLOAD_SESSIONS_PATH + "/" + sessId).then(function (response) {
        var status = response.data.paymentStatus;

        if (statusFoundFn(status)) {
          clearInterval(poll);
          return resolve();
        }
      }).catch(function (err) {
        clearInterval(poll);
        return reject(err);
      });
    }, POLL_INTERVAL);
  });
};

export var confirmPendingPoll = function confirmPendingPoll(host, sessId) {
  return pollPaymentStatus(host, sessId, function (status) {
    return status === PAYMENT_STATUS.PENDING || status === PAYMENT_STATUS.CONFIRMED;
  });
};

export var confirmPaidPoll = function confirmPaidPoll(host, sessId) {
  return pollPaymentStatus(host, sessId, function (status) {
    return status === PAYMENT_STATUS.CONFIRMED;
  });
};