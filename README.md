[![view on npm](https://img.shields.io/npm/v/oyster-streamable.svg)](https://www.npmjs.org/package/oyster-streamable)
[![npm module downloads](https://img.shields.io/npm/dt/oyster-streamable.svg)](https://www.npmjs.org/package/oyster-streamable)
[![Build Status](https://travis-ci.org/oysterprotocol/oyster-streamable.svg?branch=master)](https://travis-ci.org/oysterprotocol/oyster-streamable)

# oyster-streamable

A proof of concept, streamable implementation of the Oyster Protocol (not fully compatible)
with a few significant changes:

- CryptoJS replaced with node-forge
- Encryption/decryption key is the SHA-256 hash of the handle, per-chunk IV (see [#109](https://github.com/oysterprotocol/webinterface/issues/109))
- Communication with the nodes via [IXI module](https://github.com/nullpilot/oyster.ixi) to save bandwidth
- Pipelined processing:
  - File > Encryption > Upload
  - Download > Decryption > Blob

## API Reference
oyster-streamable js interface for Oyster file storage

**Example**  
```jsimport Oyster from 'oyster-streamable'```

* [oyster-streamable](#module_oyster-streamable)
    * [module.exports](#exp_module_oyster-streamable--module.exports) ⏏
        * [~Upload](#module_oyster-streamable--module.exports..Upload)
            * [new Upload(filename, size, options)](#new_module_oyster-streamable--module.exports..Upload_new)

<a name="exp_module_oyster-streamable--module.exports"></a>

### module.exports ⏏
Uploading files

**Kind**: Exported class  
<a name="module_oyster-streamable--module.exports..Upload"></a>

#### module.exports~Upload
**Kind**: inner class of [<code>module.exports</code>](#exp_module_oyster-streamable--module.exports)  
**Depreciated**:   
<a name="new_module_oyster-streamable--module.exports..Upload_new"></a>

##### new Upload(filename, size, options)

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | the name of the file being uploaded |
| size | <code>number</code> | the size of the file |
| options | <code>object</code> | an options object |

**Example**  
```jsimport Oyster from 'oyster-streamable'const file = fileInput.files[0]const upload = new Oyster.Upload(file)upload.on('invoice', invoice => {  console.log(invoice)  // {address: "<ETH_ADDRESS>", cost: 20}})upload.on('finish', filedata => {  console.log(filedata)  // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}})```

- - -

<a name="module_oyster-streamable--module.exports..Upload"></a>

### module.exports~Upload
**Kind**: inner class of [<code>module.exports</code>](#exp_module_oyster-streamable--module.exports)  
**Depreciated**:   
<a name="new_module_oyster-streamable--module.exports..Upload_new"></a>

#### new Upload(filename, size, options)

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | the name of the file being uploaded |
| size | <code>number</code> | the size of the file |
| options | <code>object</code> | an options object |

**Example**  
```jsimport Oyster from 'oyster-streamable'const file = fileInput.files[0]const upload = new Oyster.Upload(file)upload.on('invoice', invoice => {  console.log(invoice)  // {address: "<ETH_ADDRESS>", cost: 20}})upload.on('finish', filedata => {  console.log(filedata)  // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}})```
<a name="new_module_oyster-streamable--module.exports..Upload_new"></a>

### new Upload(filename, size, options)

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | the name of the file being uploaded |
| size | <code>number</code> | the size of the file |
| options | <code>object</code> | an options object |

**Example**  
```jsimport Oyster from 'oyster-streamable'const file = fileInput.files[0]const upload = new Oyster.Upload(file)upload.on('invoice', invoice => {  console.log(invoice)  // {address: "<ETH_ADDRESS>", cost: 20}})upload.on('finish', filedata => {  console.log(filedata)  // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}})```

* * *

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
