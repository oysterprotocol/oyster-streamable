"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var _readableStream = require("readable-stream");

var _mime = require("mime");

var _mime2 = _interopRequireDefault(_mime);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return call && (typeof call === "object" || typeof call === "function")
    ? call
    : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError(
      "Super expression must either be null or a function, not " +
        typeof superClass
    );
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
}

var DEFAULT_OPTIONS = Object.freeze({});

var FilePreviewStream = (function(_Writable) {
  _inherits(FilePreviewStream, _Writable);

  function FilePreviewStream(metadata, options) {
    _classCallCheck(this, FilePreviewStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(
      this,
      (
        FilePreviewStream.__proto__ || Object.getPrototypeOf(FilePreviewStream)
      ).call(this, opts)
    );

    _this.options = opts;
    _this.metadata = metadata;
    _this.fileChunks = [];
    _this.file = null;
    return _this;
  }

  _createClass(FilePreviewStream, [
    {
      key: "_write",
      value: function _write(data, _encoding, callback) {
        this.fileChunks.push(data);
        callback();
      }
    },
    {
      key: "_final",
      value: function _final(callback) {
        var type = _mime2.default.getType(this.metadata.ext);
        this.result = new Blob(this.fileChunks, { type: type });
        callback();
      }
    }
  ]);

  return FilePreviewStream;
})(_readableStream.Writable);

exports.default = FilePreviewStream;
