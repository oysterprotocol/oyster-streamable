"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMetadata = exports.pollMetadata = exports.pollIotaProgress = undefined;

var _datamapGenerator = require("datamap-generator");

var _datamapGenerator2 = _interopRequireDefault(_datamapGenerator);

var _difference = require("lodash/difference");

var _difference2 = _interopRequireDefault(_difference);

var _backend = require("./backend");

var _util = require("../util");

var _math = require("../utils/math");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// TODO: Make these configurable?
var POLL_INTERVAL = 4500;
var NUM_POLLING_ADDRESSES = 301;

var getSampleAddresses = function getSampleAddresses(addresses) {
  if (addresses.length <= NUM_POLLING_ADDRESSES) return addresses;

  var sampleAddresses = [];

  var first = addresses[0];
  var last = addresses[addresses.length - 1];
  var sampleCount = NUM_POLLING_ADDRESSES - 2; // Already accounting for first and last.
  var stepSize = Math.floor(Math.max(1, (addresses.length - 2) / sampleCount));

  if (stepSize === 1) return addresses; // Small optimization.

  first && sampleAddresses.push(first);
  for (var i = stepSize - 1; i < addresses.length; i += stepSize) {
    addresses[i] && sampleAddresses.push(addresses[i]);
  }
  last && sampleAddresses.push(last);

  return sampleAddresses;
};

var pollAddresses = function pollAddresses(iotaProvider, addresses, progCb) {
  return new Promise(function(resolve, reject) {
    var addrCount = addresses.length;
    var remainingAddresses = addresses; // Mutate this.

    var pollInterval = setIntervalAndExecute(function() {
      iotaProvider.api.findTransactions(
        { addresses: remainingAddresses },
        function(error, transactionHashes) {
          if (error) {
            window.clearInterval(pollInterval);
            return reject(error);
          }

          iotaProvider.api.getTransactionsObjects(transactionHashes, function(
            err,
            txs
          ) {
            if (err) {
              window.clearInterval(pollInterval);
              return reject(error);
            }

            var addrsFound = txs.map(function(_ref) {
              var address = _ref.address;
              return address;
            });
            var diff = (0, _difference2.default)(
              remainingAddresses,
              addrsFound
            );

            if (diff.length > 0) {
              var prog = (1 - diff.length / addrCount) * 100;
              progCb && progCb((0, _math.clamp)(prog, 0, 100));
              remainingAddresses = diff; // Poll less addresses.
            } else {
              progCb && progCb(100);
              window.clearInterval(pollInterval);
              return resolve();
            }
          });
        }
      );
    }, POLL_INTERVAL);

    return pollInterval; // Return interval so caller can cancel.
  });
};

/*
 * Public
 */

// This is copied and pasted from backend.js
var setIntervalAndExecute = function setIntervalAndExecute(fn, t) {
  fn();
  return setInterval(fn, t);
};

var pollIotaProgress = (exports.pollIotaProgress = function pollIotaProgress(
  datamap,
  iotaProvider,
  progCb
) {
  var addresses = Object.values(datamap);
  var sampleAddresses = getSampleAddresses(addresses);

  return pollAddresses(iotaProvider, sampleAddresses, progCb);
});

var pollMetadata = (exports.pollMetadata = function pollMetadata(
  handle,
  iotaProviders
) {
  return new Promise(function(resolve, reject) {
    var poll = setIntervalAndExecute(function() {
      getMetadata(handle, iotaProviders)
        .then(function(res) {
          clearInterval(poll);
          resolve(res);
        })
        // TODO: Continue only if "File does not exist" error.
        // TODO: Timeout if this takes too long?
        .catch(function() {
          return console.log("Waiting for meta...");
        }); // No-op. Waits for meta to attach.
    }, POLL_INTERVAL);
  });
});

var getMetadata = (exports.getMetadata = function getMetadata(
  handle,
  iotaProviders
) {
  return new Promise(function(resolve, reject) {
    var genesisHash = _datamapGenerator2.default.genesisHash(handle);
    var queries = Promise.all(
      iotaProviders.map(function(provider) {
        return new Promise(function(resolve, reject) {
          (0, _backend.queryGeneratedSignatures)(provider, genesisHash, 1).then(
            function(signatures) {
              return resolve({ provider: provider, signatures: signatures });
            },
            reject
          );
        });
      })
    );

    return queries
      .then(function(result) {
        var _ref2 =
            result.find(function(res) {
              return !!res.signatures.data[0];
            }) || {},
          provider = _ref2.provider,
          signatures = _ref2.signatures;

        var signature = signatures ? signatures.data[0] : null;

        if (signature === null) reject(new Error("File does not exist."));

        var _decryptMetadata = (0, _util.decryptMetadata)(
            (0, _util.bytesFromHandle)(handle),
            signature
          ),
          version = _decryptMetadata.version,
          metadata = _decryptMetadata.metadata;

        resolve({ provider: provider, metadata: metadata, version: version });
      })
      .catch(reject);
  });
});
