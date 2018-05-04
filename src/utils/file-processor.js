export function createMetaData (fileName, numberOfChunks) {
  const fileExtension = fileName.split(".").pop()

  const meta = {
    fileName: fileName.substr(0, 500),
    ext: fileExtension,
    numberOfChunks
  }

  return JSON.stringify(meta)
}
