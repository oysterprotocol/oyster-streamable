var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { Writable } from "readable-stream";

var DEFAULT_OPTIONS = Object.freeze({});

var FilePreviewStream = function (_Writable) {
  _inherits(FilePreviewStream, _Writable);

  function FilePreviewStream(metadata, options) {
    _classCallCheck(this, FilePreviewStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (FilePreviewStream.__proto__ || Object.getPrototypeOf(FilePreviewStream)).call(this, opts));

    _this.options = opts;
    _this.metadata = metadata;
    _this.chunks = [];
    _this.totalLength = 0;
    return _this;
  }

  _createClass(FilePreviewStream, [{
    key: "_write",
    value: function _write(data, encoding, callback) {
      this.totalLength += data.length;
      this.chunks.push(data);
      callback();
    }
  }, {
    key: "_final",
    value: function _final(callback) {
      this.result = new Buffer.concat(this.chunks, this.totalLength);
      callback();
    }
  }]);

  return FilePreviewStream;
}(Writable);

export default FilePreviewStream;