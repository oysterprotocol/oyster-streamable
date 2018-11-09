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

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @module oyster-streamable
 * @typicalname Oyster
 *
 * @description Importing oyster-streamable
 *
 * @example <caption>As an ES Module</caption>
 * ```js
 * import Oyster from 'oyster-streamable'
 * ```
 *
 * @example <caption>As a Node Module</caption>
 * ```js
 * const Oyster = require(`oyster-streamable`)
 * ```
 *
 * @example <caption>As a UMD Module</caption>
 * ```js
 * window.Oyster = Oyster.default
 * ```
 */
exports.default = {
  Upload: _upload2.default,
  UploadProgress: _uploadProgress2.default,
  Download: _download2.default
};
