# oyster-streamable

A proof of concept, streamable implementation of the Oyster Protocol (not fully compatible)
with a few significant changes:

- CryptoJS replaced with node-forge
- Encryption/decryption key is the SHA-256 hash of the handle, per-chunk IV (see [#109](https://github.com/oysterprotocol/webinterface/issues/109))
- Communication with the nodes via [IXI module](https://github.com/nullpilot/oyster.ixi) to save bandwidth
- Pipelined processing:
  - File > Encryption > Upload
  - Download > Decryption > Blob

## Downloads

```js
import Oyster from 'oyster-streamable'

const download = new Oyster.Download(handle)

download.on('meta', metadata => {
  console.log(metadata)
  // {fileName: "oyster.txt", ext: "txt", numberOfChunks: 2}
})
download.on('finish', filedata => {
  console.log(filedata)
  // {file: Blob(), metadata: {…}, target: Download}
})
```

## Uploads

```js
import Oyster from 'oyster-streamable'

const file = fileInput.files[0]
const upload = new Oyster.Upload(file)

upload.on('invoice', invoice => {
  console.log(invoice)
  // {address: "<ETH_ADDRESS>", cost: 20}
})
upload.on('finish', filedata => {
  console.log(filedata)
  // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}
})
```

## What's next?

Possible things to look into:

- Full compatibility
- Pluggable source streams for uploads and target streams for downloads, allowing:
- Node compatability
- Video streams via [MediaSource](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource)
- Arbitrary size downloads via [StreamSaver](https://github.com/jimmywarting/StreamSaver.js)

## Credits

This repo is based on the official [oysterprotocol/webinterface](https://github.com/oysterprotocol/webinterface) and shares a fair amount of code with the project where it makes sense.

Big thanks to everyone working on Oyster!
