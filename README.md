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
<a name="module_oyster-streamable"></a>

## oyster-streamable
Importing oyster-streamable

**Example** *(As an ES Module)*  
```js
import Oyster from 'oyster-streamable'
```
**Example** *(As a Node Module)*  
```js
const Oyster = require(`oyster-streamable`)
```
**Example** *(As a UMD Module)*  
```js
window.Oyster = Oyster.default
```

* [oyster-streamable](#module_oyster-streamable)
    * [.Download](#module_oyster-streamable.Download)
        * [.EVENTS](#module_oyster-streamable.Download.EVENTS)
            * ["DOWNLOAD_PROGRESS"](#module_oyster-streamable.Download.EVENTS+event_DOWNLOAD_PROGRESS)
            * ["FINISH"](#module_oyster-streamable.Download.EVENTS+event_FINISH)
            * ["METADATA"](#module_oyster-streamable.Download.EVENTS+event_METADATA)
        * [.toBuffer(handle, options)](#module_oyster-streamable.Download.toBuffer) ⇒ <code>Download</code>
        * [.toBlob(handle, options)](#module_oyster-streamable.Download.toBlob) ⇒ <code>Download</code>
    * [.Upload](#module_oyster-streamable.Upload)
        * [.EVENTS](#module_oyster-streamable.Upload.EVENTS)
            * ["INVOICE"](#module_oyster-streamable.Upload.EVENTS+event_INVOICE)
            * ["CHUNKS_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS)
            * ["UPLOAD_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS)
            * ["FINISH"](#module_oyster-streamable.Upload.EVENTS+event_FINISH)
        * [.EVENTS](#module_oyster-streamable.Upload.EVENTS)
            * ["INVOICE"](#module_oyster-streamable.Upload.EVENTS+event_INVOICE)
            * ["CHUNKS_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS)
            * ["UPLOAD_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS)
            * ["FINISH"](#module_oyster-streamable.Upload.EVENTS+event_FINISH)
        * [.fromFile(file, options)](#module_oyster-streamable.Upload.fromFile) ⇒ <code>Upload</code>
        * [.fromData(buffer, filename, options)](#module_oyster-streamable.Upload.fromData) ⇒ <code>Upload</code>

<a name="module_oyster-streamable.Download"></a>

### Oyster.Download
**Kind**: static class of [<code>oyster-streamable</code>](#module_oyster-streamable)  
**Emits**: [<code>METADATA</code>](#module_oyster-streamable.Download.EVENTS+event_METADATA), [<code>DOWNLOAD_PROGRESS</code>](#module_oyster-streamable.Download.EVENTS+event_DOWNLOAD_PROGRESS), [<code>FINISH</code>](#module_oyster-streamable.Download.EVENTS+event_FINISH)  

* [.Download](#module_oyster-streamable.Download)
    * [.EVENTS](#module_oyster-streamable.Download.EVENTS)
        * ["DOWNLOAD_PROGRESS"](#module_oyster-streamable.Download.EVENTS+event_DOWNLOAD_PROGRESS)
        * ["FINISH"](#module_oyster-streamable.Download.EVENTS+event_FINISH)
        * ["METADATA"](#module_oyster-streamable.Download.EVENTS+event_METADATA)
    * [.toBuffer(handle, options)](#module_oyster-streamable.Download.toBuffer) ⇒ <code>Download</code>
    * [.toBlob(handle, options)](#module_oyster-streamable.Download.toBlob) ⇒ <code>Download</code>

<a name="module_oyster-streamable.Download.EVENTS"></a>

#### Download.EVENTS
Events fired during the download lifecycle

**Kind**: static constant of [<code>Download</code>](#module_oyster-streamable.Download)  

* [.EVENTS](#module_oyster-streamable.Download.EVENTS)
    * ["DOWNLOAD_PROGRESS"](#module_oyster-streamable.Download.EVENTS+event_DOWNLOAD_PROGRESS)
    * ["FINISH"](#module_oyster-streamable.Download.EVENTS+event_FINISH)
    * ["METADATA"](#module_oyster-streamable.Download.EVENTS+event_METADATA)

<a name="module_oyster-streamable.Download.EVENTS+event_DOWNLOAD_PROGRESS"></a>

##### "DOWNLOAD_PROGRESS"
Fired when a successful poll is performed while retrieving a file

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Download.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| progress | <code>Object</code> | a progress object |
| progress.progress | <code>Number</code> | the percentage of progress for the download |

<a name="module_oyster-streamable.Download.EVENTS+event_FINISH"></a>

##### "FINISH"
Fired when the file has been reconstructed and is ready for use

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Download.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| file | <code>File</code> \| <code>Buffer</code> | the file as an object as the target type of the download instance |
| metadata | <code>Object</code> | the metadata object associated with the file |

<a name="module_oyster-streamable.Download.EVENTS+event_METADATA"></a>

##### "METADATA"
Fired when the file metadata has been reconstructed and is ready for use

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Download.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| fileName | <code>String</code> | the name of the file being downloaded |
| ext | <code>String</code> | the file extension of the file being downloaded |
| numberOfChunks | <code>Number</code> | the number of chunks that the file is stored in |

<a name="module_oyster-streamable.Download.toBuffer"></a>

#### Download.toBuffer(handle, options) ⇒ <code>Download</code>
**Kind**: static method of [<code>Download</code>](#module_oyster-streamable.Download)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handle | <code>String</code> |  | the handle of the file to download |
| options | <code>Object</code> |  | the options for the download |
| options.iotaProviders | <code>Array.&lt;Object&gt;</code> \| <code>Array.&lt;IOTA&gt;</code> |  | an array of IOTA initialization Objects or IOTA instances |
| [options.autoStart] | <code>Boolean</code> | <code>true</code> | immediately start the download |

**Example** *(To **Buffer** object (node))*  
```js
const download = Oyster.Download.toBuffer(handle, {
  iotaProviders: [
    { provider: 'https://poll.oysternodes.com:14265/' },
    { provider: 'https://download.oysternodes.com:14265/' }
  ]
})

download.on('meta', metadata => {
  console.log(metadata)
  // {fileName: "oyster.txt", ext: "txt", numberOfChunks: 2}
})
download.on('finish', filedata => {
  console.log(filedata)
  // {file: Buffer(), metadata: {…}, target: Download}
})
```
<a name="module_oyster-streamable.Download.toBlob"></a>

#### Download.toBlob(handle, options) ⇒ <code>Download</code>
**Kind**: static method of [<code>Download</code>](#module_oyster-streamable.Download)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handle | <code>String</code> |  | the handle of the file to download |
| options | <code>Object</code> |  | the options for the download |
| options.iotaProviders | <code>Array.&lt;Object&gt;</code> \| <code>Array.&lt;IOTA&gt;</code> |  | an array of IOTA initialization Objects or IOTA instances |
| [options.autoStart] | <code>Boolean</code> | <code>true</code> | immediately start the download |

**Example** *(To **Blob** object (browser))*  
```js
const download = Oyster.Download.toBlob(handle, {
  iotaProviders: [
    { provider: 'https://poll.oysternodes.com:14265/' },
    { provider: 'https://download.oysternodes.com:14265/' }
  ]
})

download.on('meta', metadata => {
  console.log(metadata)
  // {fileName: "oyster.txt", ext: "txt", numberOfChunks: 2}
})
download.on('finish', filedata => {
  console.log(filedata)
  // {file: Blob(), metadata: {…}, target: Download}
})
```
<a name="module_oyster-streamable.Upload"></a>

### Oyster.Upload
**Kind**: static class of [<code>oyster-streamable</code>](#module_oyster-streamable)  
**Emits**: [<code>INVOICE</code>](#module_oyster-streamable.Upload.EVENTS+event_INVOICE), [<code>CHUNKS_PROGRESS</code>](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS), [<code>UPLOAD_PROGRESS</code>](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS), [<code>FINISH</code>](#module_oyster-streamable.Upload.EVENTS+event_FINISH)  

* [.Upload](#module_oyster-streamable.Upload)
    * [.EVENTS](#module_oyster-streamable.Upload.EVENTS)
        * ["INVOICE"](#module_oyster-streamable.Upload.EVENTS+event_INVOICE)
        * ["CHUNKS_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS)
        * ["UPLOAD_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS)
        * ["FINISH"](#module_oyster-streamable.Upload.EVENTS+event_FINISH)
    * [.EVENTS](#module_oyster-streamable.Upload.EVENTS)
        * ["INVOICE"](#module_oyster-streamable.Upload.EVENTS+event_INVOICE)
        * ["CHUNKS_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS)
        * ["UPLOAD_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS)
        * ["FINISH"](#module_oyster-streamable.Upload.EVENTS+event_FINISH)
    * [.fromFile(file, options)](#module_oyster-streamable.Upload.fromFile) ⇒ <code>Upload</code>
    * [.fromData(buffer, filename, options)](#module_oyster-streamable.Upload.fromData) ⇒ <code>Upload</code>

<a name="module_oyster-streamable.Upload.EVENTS"></a>

#### Upload.EVENTS
Events fired during the upload lifecycle

**Kind**: static constant of [<code>Upload</code>](#module_oyster-streamable.Upload)  

* [.EVENTS](#module_oyster-streamable.Upload.EVENTS)
    * ["INVOICE"](#module_oyster-streamable.Upload.EVENTS+event_INVOICE)
    * ["CHUNKS_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS)
    * ["UPLOAD_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS)
    * ["FINISH"](#module_oyster-streamable.Upload.EVENTS+event_FINISH)

<a name="module_oyster-streamable.Upload.EVENTS+event_INVOICE"></a>

##### "INVOICE"
Fired when an invoice is recieved from the broker node

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| handle | <code>String</code> | the handle of the file uploaded |
| address | <code>String</code> | an ethereum address to send the pearl to |
| cost | <code>Number</code> | the cost of the file upload |

<a name="module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS"></a>

##### "CHUNKS_PROGRESS"
Fired when a chunk is uploaded to the broker

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| progress | <code>Object</code> | a progress object |
| progress.progress | <code>Number</code> | the percentage of progress for the chunk upload |

<a name="module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS"></a>

##### "UPLOAD_PROGRESS"
Fired when a chunk is attached to the tangle

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| progress | <code>Object</code> | a progress object |
| progress.progress | <code>Number</code> | the percentage of progress for the chunk attachment |

<a name="module_oyster-streamable.Upload.EVENTS+event_FINISH"></a>

##### "FINISH"
Fired when the file has been completely attached to the tangle

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| handle | <code>String</code> | the handle of the file uploaded |
| metadata | <code>Object</code> | the metadata object associated with the file |

<a name="module_oyster-streamable.Upload.EVENTS"></a>

#### Upload.EVENTS
Events fired during the upload lifecycle

**Kind**: static constant of [<code>Upload</code>](#module_oyster-streamable.Upload)  

* [.EVENTS](#module_oyster-streamable.Upload.EVENTS)
    * ["INVOICE"](#module_oyster-streamable.Upload.EVENTS+event_INVOICE)
    * ["CHUNKS_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS)
    * ["UPLOAD_PROGRESS"](#module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS)
    * ["FINISH"](#module_oyster-streamable.Upload.EVENTS+event_FINISH)

<a name="module_oyster-streamable.Upload.EVENTS+event_INVOICE"></a>

##### "INVOICE"
Fired when an invoice is recieved from the broker node

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| handle | <code>String</code> | the handle of the file uploaded |
| address | <code>String</code> | an ethereum address to send the pearl to |
| cost | <code>Number</code> | the cost of the file upload |

<a name="module_oyster-streamable.Upload.EVENTS+event_CHUNKS_PROGRESS"></a>

##### "CHUNKS_PROGRESS"
Fired when a chunk is uploaded to the broker

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| progress | <code>Object</code> | a progress object |
| progress.progress | <code>Number</code> | the percentage of progress for the chunk upload |

<a name="module_oyster-streamable.Upload.EVENTS+event_UPLOAD_PROGRESS"></a>

##### "UPLOAD_PROGRESS"
Fired when a chunk is attached to the tangle

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| progress | <code>Object</code> | a progress object |
| progress.progress | <code>Number</code> | the percentage of progress for the chunk attachment |

<a name="module_oyster-streamable.Upload.EVENTS+event_FINISH"></a>

##### "FINISH"
Fired when the file has been completely attached to the tangle

**Kind**: event emitted by [<code>EVENTS</code>](#module_oyster-streamable.Upload.EVENTS)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| handle | <code>String</code> | the handle of the file uploaded |
| metadata | <code>Object</code> | the metadata object associated with the file |

<a name="module_oyster-streamable.Upload.fromFile"></a>

#### Upload.fromFile(file, options) ⇒ <code>Upload</code>
**Kind**: static method of [<code>Upload</code>](#module_oyster-streamable.Upload)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| file | <code>File</code> |  | the file to upload |
| options | <code>Object</code> |  | the options for the upload |
| options.iotaProvider | <code>Object</code> \| <code>IOTA</code> |  | an IOTA initialization Object or IOTA instance |
| options.alpha | <code>String</code> |  | the endpoint for the alpha broker |
| options.beta | <code>String</code> |  | the endpoint for the beta broker |
| options.epochs | <code>Number</code> |  | the number of years to store the file |
| [options.autoStart] | <code>Boolean</code> | <code>true</code> | immediately start the upload |

**Example** *(From **File** object (browser))*  
```js
const file = fileInput.files[0];
const upload = Oyster.Upload.fromFile(file, {
  iotaProvider: { provider: 'https://poll.oysternodes.com:14265/' },
  alpha: 'https://broker-1.oysternodes.com/',
  beta: 'https://broker-2.oysternodes.com/',
  epochs: 1
});

upload.on('invoice', invoice => {
  console.log(invoice)
  // {address: "<ETH_ADDRESS>", cost: 20}
});
upload.on('finish', filedata => {
  console.log(filedata)
  // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}
});
```
<a name="module_oyster-streamable.Upload.fromData"></a>

#### Upload.fromData(buffer, filename, options) ⇒ <code>Upload</code>
**Kind**: static method of [<code>Upload</code>](#module_oyster-streamable.Upload)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| buffer | <code>Buffer</code> |  | the data Buffer to upload |
| filename | <code>String</code> |  | the name of the file |
| options | <code>Object</code> |  | the options for the upload |
| options.iotaProvider | <code>Object</code> \| <code>IOTA</code> |  | an IOTA initialization Object or IOTA instance |
| options.alpha | <code>String</code> |  | the endpoint for the alpha broker |
| options.beta | <code>String</code> |  | the endpoint for the beta broker |
| options.epochs | <code>Number</code> |  | the number of years to store the file |
| [options.autoStart] | <code>Boolean</code> | <code>true</code> | immediately start the upload |

**Example** *(From **Buffer** object (node))*  
```js
const fs = require('fs');
const path = './path/to/file';
const filename = 'somefile.txt';

fs.readFile(`${path}/${filename}`, (err, data) => {
  if (err) throw err;

  const upload = Oyster.Upload.fromData(data, filename, {
    iotaProvider: { provider: 'https://poll.oysternodes.com:14265/' },
    alpha: 'https://broker-1.oysternodes.com/',
    beta: 'https://broker-2.oysternodes.com/',
    epochs: 1
  });

  upload.on('invoice', invoice => {
    console.log(invoice)
    // {address: "<ETH_ADDRESS>", cost: 20}
  });
  upload.on('finish', filedata => {
    console.log(filedata)
    // {handle: "<OYSTER_HANDLE>", metadata: {…}, target: Upload}
  });
});
```

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
