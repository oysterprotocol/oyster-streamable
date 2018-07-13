var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var clamp = function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

var selectPollingIndexes = function selectPollingIndexes(addresses, numPollingAddresses, bundleSize) {
  // What this if is checking for is basically medium-sized uploads
  // which would have been better off with the old random index selection.
  // For those uploads, pick indexes the old way.
  if (addresses.length < (bundleSize + bundleSize / 2) / 2 * numPollingAddresses) {
    var indexArray = [0];
    while (addresses.length - 1 > indexArray[indexArray.length - 1]) {
      indexArray = indexArray.concat(Math.min.apply(Math, [indexArray[indexArray.length - 1] + Math.floor(Math.random() * (bundleSize / 2)) + bundleSize / 2, addresses.length - 1]));
    }
    if (indexArray.length === 2) {
      //make sure there's always at least 3 addresses
      indexArray.splice(1, 0, Math.floor(addresses.length / 2));
    }
    return indexArray;
  } else {
    var offset = addresses.length / (numPollingAddresses - 1);

    var indexes = [];
    for (var i = 0; i <= numPollingAddresses - 2; i++) {
      indexes.push(Math.floor(i * offset));
    }
    indexes.push(addresses.length - 1);

    return indexes;
  }
};

/**
 * IOTA Polling (Copied from webinterface)
 */

var skinnyQueryTransactions = function skinnyQueryTransactions(iotaProvider, addresses) {
  return new Promise(function (resolve, reject) {
    iotaProvider.api.findTransactions({ addresses: addresses }, function (error, transactionHashes) {
      if (error) {
        console.log("IOTA ERROR: ", error);
      }
      resolve(transactionHashes);
    });
  });
};

var checkUploadPercentage = function checkUploadPercentage(itoaProvider, addresses, indexes) {
  return new Promise(function (resolve, reject) {
    var promises = [];

    promises.push(new Promise(function (resolve, reject) {
      skinnyQueryTransactions(itoaProvider, [addresses[indexes[0]]]).then(function (transactions) {
        resolve({ removeIndex: transactions.length > 0 });
      });
    }));

    if (indexes.length > 1) {
      promises.push(new Promise(function (resolve, reject) {
        skinnyQueryTransactions(itoaProvider, [addresses[indexes[indexes.length - 1]]]).then(function (transactions) {
          resolve({ removeIndex: transactions.length > 0 });
        });
      }));
    }

    return Promise.all(promises).then(function (indexResults) {
      var _indexResults = _slicedToArray(indexResults, 2),
          front = _indexResults[0],
          back = _indexResults[1];

      if (front.removeIndex) indexes.shift();
      if (back && back.removeIndex) indexes.pop();

      return resolve(indexes);
    });
  });
};

/**
 * Public
 */

// TODO: Make these configurable?
var MIN_PROG = 0.02;
var POLL_INTERVAL = 4000;
var BUNDLE_SIZE = 100;
var NUM_POLLING_ADDRESSES = 301;

// This is copied and pasted from backend.js
var setIntervalAndExecute = function setIntervalAndExecute(fn, t) {
  fn();
  return setInterval(fn, t);
};

export var pollIotaProgress = function pollIotaProgress(datamap, iotaProvider, progCb) {
  return new Promise(function (resolve, reject) {
    var addresses = Object.values(datamap);
    var indexes = selectPollingIndexes(addresses, NUM_POLLING_ADDRESSES, BUNDLE_SIZE);
    var indexesLen = indexes.length;

    var poll = setIntervalAndExecute(function () {
      checkUploadPercentage(iotaProvider, addresses, indexes).then(function (idxs) {
        // Uh oh, race condition.
        indexes = idxs;

        // Emit progress.
        var prog = clamp(1 - idxs.length / indexesLen, MIN_PROG, 1.0) * 100;
        progCb(prog);

        // Include a small epsilon for floating point errors.
        if (prog >= 99.0) {
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