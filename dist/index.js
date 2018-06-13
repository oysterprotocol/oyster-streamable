'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _upload = require('./upload');

var _upload2 = _interopRequireDefault(_upload);

var _download = require('./download');

var _download2 = _interopRequireDefault(_download);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { Upload: _upload2.default, Download: _download2.default };