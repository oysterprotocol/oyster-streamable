"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.confirmPaidPoll = exports.confirmPendingPoll = undefined;
exports.queryGeneratedSignatures = queryGeneratedSignatures;
exports.createUploadSession = createUploadSession;
exports.sendToBroker = sendToBroker;
exports.sendChunksToBroker = sendChunksToBroker;
exports.signTreasures = signTreasures;
exports.getUnsignedTreasure = getUnsignedTreasure;
exports.setSignedTreasures = setSignedTreasures;

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _config = require("../config");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var CURRENT_VERSION = 1;
var SESSIONS_PATH = _config.API.V2_UPLOAD_SESSIONS_PATH;

_axios2.default.defaults.timeout = 60000;

function queryGeneratedSignatures(iotaProvider, hash, count) {
  var binary =
    arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  return new Promise(function(resolve, reject) {
    var data = {
      command: "Oyster.findGeneratedSignatures",
      version: CURRENT_VERSION,
      hash: hash,
      count: count,
      binary: binary
    };

    var opts = {
      responseType: binary ? "arraybuffer" : "json",
      headers: { "X-IOTA-API-Version": "1" }
    };

    _axios2.default
      .post(iotaProvider.provider, data, opts)
      .then(function(response) {
        if (response.status !== 200) {
          throw "Request failed (" +
            response.status +
            ") " +
            response.statusText;
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

function createUploadSession(
  filesize,
  genesisHash,
  numChunks,
  alpha,
  beta,
  epochs
) {
  return new Promise(function(resolve, reject) {
    _axios2.default
      .post("" + alpha + _config.API.V2_UPLOAD_SESSIONS_PATH, {
        fileSizeBytes: filesize,
        numChunks: numChunks,
        genesisHash: genesisHash,
        betaIp: beta,
        storageLengthInYears: epochs
      })
      .then(function(_ref) {
        var data = _ref.data;
        var alphaSessionId = data.id,
          betaSessionId = data.betaSessionId;
        var invoice = data.invoice;

        resolve({
          alphaSessionId: alphaSessionId,
          betaSessionId: betaSessionId,
          invoice: invoice
        });
      })
      .catch(reject);
  });
}

function sendToBroker(broker, sessId, chunks) {
  var endpoint = "" + broker + SESSIONS_PATH + "/" + sessId;
  return sendChunksToBroker(endpoint, chunks);
}

function sendChunksToBroker(brokerUrl, chunks) {
  return new Promise(function(resolve, reject) {
    _axios2.default
      .put(brokerUrl, { chunks: chunks })
      .then(function(response) {
        return resolve(response);
      })
      .catch(reject);
  });
}

function signTreasures(
  alphaData,
  betaData,
  handle,
  unsignedTreasurePath,
  signedTreasurePath
) {
  // let alphaUnsignedTreasures = getUnsignedTreasure(
  //   alphaData.broker,
  //   alphaData.sessionID,
  //   unsignedTreasurePath
  // );
  // let betaUnsignedTreasures = getUnsignedTreasure(
  //   betaData.broker,
  //   betaData.sessionID,
  //   unsignedTreasurePath
  // );

  var unsignedTreasures = Promise.all([
    new Promise(function(resolve, reject) {
      getUnsignedTreasure(
        alphaData.broker,
        alphaData.sessionID,
        unsignedTreasurePath
      ).then(function(unsignedTreasures) {
        return resolve(unsignedTreasures);
      }, reject);
    }),
    new Promise(function(resolve, reject) {
      getUnsignedTreasure(
        betaData.broker,
        betaData.sessionID,
        unsignedTreasurePath
      ).then(function(unsignedTreasures) {
        return resolve(unsignedTreasures);
      }, reject);
    })
  ]);

  // make some calls to do some treasure signing logic
  // this is all just dummy data

  // if (alphaUnsignedTreasures.available) {
  //   let alphaTreasure = [];
  //   for (let i = 0; i < alphaUnsignedTreasures.unsignedTreasure.length; i++) {
  //     alphaTreasure.push("SOMETREASURE");
  //   }
  //   let payload = {
  //     signedTreasure: alphaTreasure
  //   };
  //   debugger;
  //   return setSignedTreasures(
  //     alphaData.broker,
  //     alphaData.sessionID,
  //     signedTreasurePath,
  //     payload
  //   );
  // }
  // if (betaUnsignedTreasures.available) {
  //   let betaTreasure = [];
  //   for (let i = 0; i < betaUnsignedTreasures.unsignedTreasure.length; i++) {
  //     betaTreasure.push("SOMETREASURE");
  //   }
  //   let payload = {
  //     signedTreasure: betaTreasure
  //   };
  //
  //   debugger;
  //
  //   return setSignedTreasures(
  //     betaData.broker,
  //     betaData.sessionID,
  //     signedTreasurePath,
  //     payload
  //   );
  // }

  debugger;

  // I guess this gets called if both brokers are in dummy mode?
  return new Promise(function(resolve) {
    resolve();
  });
}

function getUnsignedTreasure(broker, sessId, unsignedTreasurePath) {
  var endpoint = "" + broker + unsignedTreasurePath + "/" + sessId;
  return new Promise(function(resolve, reject) {
    _axios2.default
      .get(endpoint)
      .then(function(response) {
        return resolve(response);
      })
      .catch(reject);
  });
}

function setSignedTreasures(
  broker,
  sessId,
  signedTreasurePath,
  signedTreasures
) {
  var endpoint = "" + broker + signedTreasurePath + "/" + sessId;
  return new Promise(function(resolve, reject) {
    _axios2.default
      .put(endpoint, { signedTreasures: signedTreasures })
      .then(function(response) {
        return resolve(response);
      })
      .catch(reject);
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

/*
 * Payment polling
 */

var pollPaymentStatus = function pollPaymentStatus(
  host,
  sessId,
  statusFoundFn
) {
  return new Promise(function(resolve, reject) {
    var poll = setIntervalAndExecute(function() {
      _axios2.default
        .get("" + host + _config.API.V2_UPLOAD_SESSIONS_PATH + "/" + sessId)
        .then(function(response) {
          var status = response.data.paymentStatus;

          if (statusFoundFn(status)) {
            clearInterval(poll);
            return resolve();
          }
        })
        .catch(function(err) {
          clearInterval(poll);
          return reject(err);
        });
    }, POLL_INTERVAL);
  });
};

var confirmPendingPoll = (exports.confirmPendingPoll = function confirmPendingPoll(
  host,
  sessId
) {
  return pollPaymentStatus(host, sessId, function(status) {
    return (
      status === PAYMENT_STATUS.PENDING || status === PAYMENT_STATUS.CONFIRMED
    );
  });
});

var confirmPaidPoll = (exports.confirmPaidPoll = function confirmPaidPoll(
  host,
  sessId
) {
  return pollPaymentStatus(host, sessId, function(status) {
    return status === PAYMENT_STATUS.CONFIRMED;
  });
});
