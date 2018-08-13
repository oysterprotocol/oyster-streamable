import { queryGeneratedSignatures } from "./backend";
import { decryptMetadata } from "../util";

const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

const selectPollingIndexes = (addresses, numPollingAddresses, bundleSize) => {
  // What this if is checking for is basically medium-sized uploads
  // which would have been better off with the old random index selection.
  // For those uploads, pick indexes the old way.
  if (
    addresses.length <
    ((bundleSize + bundleSize / 2) / 2) * numPollingAddresses
  ) {
    let indexArray = [0];
    while (addresses.length - 1 > indexArray[indexArray.length - 1]) {
      indexArray = indexArray.concat(
        Math.min(
          ...[
            indexArray[indexArray.length - 1] +
              Math.floor(Math.random() * (bundleSize / 2)) +
              bundleSize / 2,
            addresses.length - 1
          ]
        )
      );
    }
    if (indexArray.length === 2) {
      //make sure there's always at least 3 addresses
      indexArray.splice(1, 0, Math.floor(addresses.length / 2));
    }
    return indexArray;
  } else {
    const offset = addresses.length / (numPollingAddresses - 1);

    let indexes = [];
    for (let i = 0; i <= numPollingAddresses - 2; i++) {
      indexes.push(Math.floor(i * offset));
    }
    indexes.push(addresses.length - 1);

    return indexes;
  }
};

/**
 * IOTA Polling (Copied from webinterface)
 */

const skinnyQueryTransactions = (iotaProvider, addresses) =>
  new Promise((resolve, reject) => {
    iotaProvider.api.findTransactions(
      { addresses },
      (error, transactionHashes) => {
        if (error) {
          console.log("IOTA ERROR: ", error);
        }
        resolve(transactionHashes);
      }
    );
  });

const checkUploadPercentage = (itoaProvider, addresses, indexes) => {
  return new Promise((resolve, reject) => {
    let promises = [];

    promises.push(
      new Promise((resolve, reject) => {
        skinnyQueryTransactions(itoaProvider, [addresses[indexes[0]]]).then(
          transactions => {
            resolve({ removeIndex: transactions.length > 0 });
          }
        );
      })
    );

    if (indexes.length > 1) {
      promises.push(
        new Promise((resolve, reject) => {
          skinnyQueryTransactions(itoaProvider, [
            addresses[indexes[indexes.length - 1]]
          ]).then(transactions => {
            resolve({ removeIndex: transactions.length > 0 });
          });
        })
      );
    }

    return Promise.all(promises).then(indexResults => {
      const [front, back] = indexResults;

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
const MIN_PROG = 0.0;
const POLL_INTERVAL = 4000;
const BUNDLE_SIZE = 100;
const NUM_POLLING_ADDRESSES = 301;

// This is copied and pasted from backend.js
const setIntervalAndExecute = (fn, t) => {
  fn();
  return setInterval(fn, t);
};

export const pollIotaProgress = (datamap, iotaProvider, progCb) =>
  new Promise((resolve, reject) => {
    let addresses = Object.values(datamap);
    let indexes = selectPollingIndexes(
      addresses,
      NUM_POLLING_ADDRESSES,
      BUNDLE_SIZE
    );
    let indexesLen = indexes.length;

    const poll = setIntervalAndExecute(() => {
      checkUploadPercentage(iotaProvider, addresses, indexes)
        .then(idxs => {
          // Uh oh, race condition.
          indexes = idxs;

          // Emit progress.
          const prog = clamp(1 - idxs.length / indexesLen, MIN_PROG, 1.0) * 100;
          progCb(prog);

          // Include a small epsilon for floating point errors.
          if (prog >= 99.0) {
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

export const getMetadata = (iotaProviders) => {
  const queries = Promise.all(
    iotaProviders.map(
      provider =>
        new Promise((resolve, reject) => {
          queryGeneratedSignatures(provider, this.genesisHash, 1).then(
            signatures => resolve({ provider, signatures }),
            reject
          );
        })
    )
  );

  return queries
    .then(result => {
      const { provider, signatures } = result.find(
        res => !!res.signatures.data[0]
      );
      const signature = signatures ? signatures.data[0] : null;

      if (signature === null) {
        throw new Error("File does not exist.");
      }

      const { version, metadata } = decryptMetadata(this.key, signature);
      this.iotaProvider = provider;
      this.metadata = metadata;
      this.emit("metadata", metadata);
      return Promise.resolve(metadata);
    })
    .catch(error => {
      throw error;
    });
}
