"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _upload = require("./upload");

var _upload2 = _interopRequireDefault(_upload);

var _uploadProgress = require("./uploadProgress");

var _uploadProgress2 = _interopRequireDefault(_uploadProgress);

var _download = require("./download");

var _download2 = _interopRequireDefault(_download);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { Upload: _upload2.default, UploadProgress: _uploadProgress2.default, Download: _download2.default };