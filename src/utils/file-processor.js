export function createMetaData({ fileName, numberOfChunks, custom }) {
  const fileExtension = fileName.split(".").pop();

  const meta = {
    fileName: fileName.substr(0, 500),
    ext: fileExtension,
    numberOfChunks,
    custom: custom || {}
  };

  return meta;
}
