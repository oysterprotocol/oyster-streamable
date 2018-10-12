import Datamap from "datamap-generator";
import difference from "lodash/difference";

import { queryGeneratedSignatures } from "./backend";
import { bytesFromHandle, decryptMetadata } from "../util";
import { clamp } from "../utils/math";

// TODO: Make these configurable?
const POLL_INTERVAL = 2000;
const NUM_POLLING_ADDRESSES = 301;

const getSampleAddresses = addresses => {
  if (addresses.length <= NUM_POLLING_ADDRESSES) return addresses;

  let sampleAddresses = [];

  const first = addresses.first;
  const last = addresses[addresses.length - 1];
  const sampleCount = NUM_POLLING_ADDRESSES - 2; // Already accounting for first and last.
  const stepSize = Math.max(1, (addresses.length - 2) / sampleCount);

  if (stepSize === 1) return addresses; // Small optimization.

  sampleAddresses.push(first);
  for (let i = stepSize - 1; i < addresses.length; i += stepSize) {
    sampleAddresses.push(addresses[i]);
  }
  sampleAddresses.push(last);

  return sampleAddresses;
};

const pollAddresses = (iotaProvider, addresses, progCb) =>
  new Promise((resolve, reject) => {
    const addrCount = addresses.length;
    let remainingAddresses = addresses; // Mutate this.

    const pollInterval = setIntervalAndExecute(() => {
      iotaProvider.api.findTransactions(
        { addresses: remainingAddresses },
        (error, transactionHashes) => {
          if (error) {
            window.clearInterval(pollInterval);
            return reject(error);
          }

          iotaProvider.api.getTransactionsObjects(
            transactionHashes,
            (err, txs) => {
              if (err) {
                window.clearInterval(pollInterval);
                return reject(error);
              }

              const addrsFound = txs.map(({ address }) => address);
              const diff = difference(addresses, addrsFound);
              console.log(diff); // TODO: Delete this log

              if (diff.length > 0) {
                const prog = (1 - diff.length / addrCount) * 100;
                progCb && progCb(clamp(prog), 0, 100);
                remainingAddresses = diff; // Poll less addresses.
              } else {
                progCb && progCb(100);
                window.clearInterval(pollInterval);
                return resolve();
              }
            }
          );
        }
      );
    }, POLL_INTERVAL);

    return pollInterval; // Return interval so caller can cancel.
  });

/*
 * Public
 */

// This is copied and pasted from backend.js
const setIntervalAndExecute = (fn, t) => {
  fn();
  return setInterval(fn, t);
};

export const pollIotaProgress = (datamap, iotaProvider, progCb) => {
  const addresses = Object.values(datamap);
  const sampleAddresses = getSampleAddresses(addresses);

  return pollAddresses(iotaProvider, sampleAddresses, progCb);
};

export const pollMetadata = (handle, iotaProviders) => {
  return new Promise((resolve, reject) => {
    const poll = setIntervalAndExecute(() => {
      getMetadata(handle, iotaProviders)
        .then(res => {
          clearInterval(poll);
          resolve(res);
        })
        // TODO: Continue only if "File does not exist" error.
        // TODO: Timeout if this takes too long?
        .catch(console.log); // No-op. Waits for meta to attach.
    }, POLL_INTERVAL);
  });
};

export const getMetadata = (handle, iotaProviders) => {
  return new Promise((resolve, reject) => {
    const genesisHash = Datamap.genesisHash(handle);
    const queries = Promise.all(
      iotaProviders.map(
        provider =>
          new Promise((resolve, reject) => {
            queryGeneratedSignatures(provider, genesisHash, 1).then(
              signatures => resolve({ provider, signatures }),
              reject
            );
          })
      )
    );

    return queries
      .then(result => {
        const { provider, signatures } =
          result.find(res => !!res.signatures.data[0]) || {};
        const signature = signatures ? signatures.data[0] : null;

        if (signature === null) reject(new Error("File does not exist."));

        const { version, metadata } = decryptMetadata(
          bytesFromHandle(handle),
          signature
        );

        resolve({ provider, metadata, version });
      })
      .catch(reject);
  });
};
