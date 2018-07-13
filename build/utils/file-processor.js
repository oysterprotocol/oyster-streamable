export function createMetaData(fileName, numberOfChunks) {
  var fileExtension = fileName.split(".").pop();

  var meta = {
    fileName: fileName.substr(0, 500),
    ext: fileExtension,
    numberOfChunks: numberOfChunks
  };

  return meta;
}