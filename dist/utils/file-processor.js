"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMetaData = createMetaData;
function createMetaData(fileName, numberOfChunks) {
  const fileExtension = fileName.split(".").pop();

  const meta = {
    fileName: fileName.substr(0, 500),
    ext: fileExtension,
    numberOfChunks
  };

  return meta;
}