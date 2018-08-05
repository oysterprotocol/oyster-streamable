"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require("node-forge/lib/util");

var _util2 = _interopRequireDefault(_util);

var _readableStream = require("readable-stream");

var _util3 = require("../util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ByteBuffer = _util2.default.ByteBuffer;
var DEFAULT_OPTIONS = Object.freeze({
  binaryMode: false,
  objectMode: true
});

var DecryptStream = function (_Transform) {
  _inherits(DecryptStream, _Transform);

  function DecryptStream(key, options) {
    _classCallCheck(this, DecryptStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (DecryptStream.__proto__ || Object.getPrototypeOf(DecryptStream)).call(this, opts));

    _this.options = opts;
    _this.key = key;
    return _this;
  }

  _createClass(DecryptStream, [{
    key: "_transform",
    value: function _transform(chunk, encoding, callback) {
      var byteBuffer = void 0;

      if (this.options.binaryMode) {
        byteBuffer = new ByteBuffer(chunk, "raw");
      } else {
        var trytes = (0, _util3.parseMessage)(chunk);
        var bytes = _util3.iota.utils.fromTrytes(trytes);

        // odd tryte count. assume treasure and continue
        if (!bytes) {
          return callback();
        }
        byteBuffer = new ByteBuffer(bytes, "binary");
      }

      var decrypted = (0, _util3.decryptBytes)(this.key, byteBuffer);
      if (decrypted) {
        callback(null, decrypted);
      } else {
        // could not decrypt. assume treasure and continue
        callback();
      }
    }
  }]);

  return DecryptStream;
}(_readableStream.Transform);

exports.default = DecryptStream;