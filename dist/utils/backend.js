"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.queryGeneratedSignatures = queryGeneratedSignatures;
exports.queryTransactionStatus = queryTransactionStatus;
exports.createUploadSession = createUploadSession;
exports.sendToBrokers = sendToBrokers;
exports.sendToBrokerA = sendToBrokerA;
exports.sendToBrokerB = sendToBrokerB;
exports.sendToBroker = sendToBroker;
exports.sendChunksToBroker = sendChunksToBroker;

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

var _fileProcessor = require("./file-processor");

var _fileProcessor2 = _interopRequireDefault(_fileProcessor);

var _encryption = require("./encryption");

var _encryption2 = _interopRequireDefault(_encryption);

var _config = require("../config");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CURRENT_VERSION = 1;
const SESSIONS_PATH = _config.API.V2_UPLOAD_SESSIONS_PATH;

const axiosInstance = _axios2.default.create({
  timeout: 200000
});

function queryGeneratedSignatures(iotaProvider, hash, count, binary = false) {
  return new Promise((resolve, reject) => {
    const data = {
      command: 'Oyster.findGeneratedSignatures',
      version: CURRENT_VERSION,
      hash,
      count,
      binary
    };

    const opts = {
      responseType: binary ? 'arraybuffer' : 'json',
      headers: { 'X-IOTA-API-Version': '1' }
    };

    axiosInstance.post(iotaProvider.provider, data, opts).then(response => {
      if (response.status !== 200) {
        throw `Request failed (${response.status}) ${response.statusText}`;
      }

      if (response.headers['content-type'] === 'application/octet-stream') {
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
    }).catch(error => {
      reject(error);
    });
  });
}

function queryTransactionStatus(iotaProvider, addresses) {
  return new Promise((resolve, reject) => {
    const data = {
      command: 'Oyster.transactionStatus',
      addresses
    };

    const opts = {
      timeout: 5000,
      responseType: 'json',
      headers: { 'X-IOTA-API-Version': '1' }
    };

    axiosInstance.post(iotaProvider.provider, data, opts).then(response => {
      if (response.status !== 200) {
        throw `Request failed (${response.status}) ${response.statusText}`;
      }

      resolve(response.data);
    });
  });
}

function createUploadSession(filesize, genesisHash, numChunks, epochs) {
  return new Promise((resolve, reject) => {
    axiosInstance.post(`${_config.API.BROKER_NODE_A}${_config.API.V2_UPLOAD_SESSIONS_PATH}`, {
      fileSizeBytes: filesize,
      numChunks,
      genesisHash,
      betaIp: _config.API.BROKER_NODE_B,
      storageLengthInYears: epochs
    }).then(({ data }) => {
      const { id: alphaSessionId, betaSessionId } = data;
      const { invoice: invoice } = data;
      resolve({ alphaSessionId, betaSessionId, invoice });
    }).catch(error => {
      console.log("UPLOAD SESSION ERROR: ", error);
      reject(error);
    });
  });
}

function sendToBrokers(sessIdA, sessIdB, chunks) {
  return Promise.all([sendToBroker(_config.API.BROKER_NODE_A, sessIdA, chunks), sendToBroker(_config.API.BROKER_NODE_B, sessIdB, chunks.slice().reverse())]);
}

function sendToBrokerA(sessId, chunks) {
  return sendToBroker(_config.API.BROKER_NODE_A, sessId, chunks);
}

function sendToBrokerB(sessId, chunks) {
  return sendToBroker(_config.API.BROKER_NODE_B, sessId, chunks);
}

function sendToBroker(broker, sessId, chunks) {
  const endpoint = `${broker}${SESSIONS_PATH}/${sessId}`;
  return sendChunksToBroker(endpoint, chunks);
}

function sendChunksToBroker(brokerUrl, chunks) {
  return new Promise((resolve, reject) => {
    axiosInstance.put(brokerUrl, { chunks }).then(response => {
      resolve(response);
    }).catch(error => {
      console.log("ERROR SENDING CHUNK TO BROKER:", error);
      reject(error);
    });
  });
}