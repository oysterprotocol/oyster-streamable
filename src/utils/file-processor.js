export function createMetaData({ fileName, numberOfChunks, alpha, beta }) {
  const fileExtension = fileName.split(".").pop();

  const meta = {
    alpha,
    beta,
    ext: fileExtension,
    fileName: fileName.substr(0, 500),
    numberOfChunks
  };

  return meta;
}
