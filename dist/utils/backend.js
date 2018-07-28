"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.confirmPaidPoll = exports.confirmPendingPoll = undefined;
exports.queryGeneratedSignatures = queryGeneratedSignatures;
exports.createUploadSession = createUploadSession;
exports.sendToBroker = sendToBroker;
exports.sendChunksToBroker = sendChunksToBroker;

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _config = require("../config");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CURRENT_VERSION = 1;
var SESSIONS_PATH = _config.API.V2_UPLOAD_SESSIONS_PATH;

var axiosInstance = _axios2.default.create({ timeout: 200000 });

function queryGeneratedSignatures(iotaProviders, hash, count) {
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

    var signatures = Promise.all(iotaProviders.map(function (provider) {
      return new Promise(function (resolve, reject) {
        axiosInstance.post(provider, data, opts).then(function (response) {
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
      }).catch(function (err) {
        reject(err);
      });
    })).then(function (dataList) {
      // console.log(dataList, dataList.find(data => !data.data))
      resolve(dataList.find(function (data) {
        return !!data.data[0];
      }));
    });
  });
}

function createUploadSession(filesize, genesisHash, numChunks, alpha, beta, epochs) {
  return new Promise(function (resolve, reject) {
    axiosInstance.post("" + alpha + _config.API.V2_UPLOAD_SESSIONS_PATH, {
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

function sendToBroker(broker, sessId, chunks) {
  var endpoint = "" + broker + SESSIONS_PATH + "/" + sessId;
  return sendChunksToBroker(endpoint, chunks);
}

function sendChunksToBroker(brokerUrl, chunks) {
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
      axiosInstance.get("" + host + _config.API.V2_UPLOAD_SESSIONS_PATH + "/" + sessId).then(function (response) {
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

var confirmPendingPoll = exports.confirmPendingPoll = function confirmPendingPoll(host, sessId) {
  return pollPaymentStatus(host, sessId, function (status) {
    return status === PAYMENT_STATUS.PENDING || status === PAYMENT_STATUS.CONFIRMED;
  });
};

var confirmPaidPoll = exports.confirmPaidPoll = function confirmPaidPoll(host, sessId) {
  return pollPaymentStatus(host, sessId, function (status) {
    return status === PAYMENT_STATUS.CONFIRMED;
  });
};