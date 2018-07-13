var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import Forge from "node-forge";
import { Transform } from "readable-stream";
import { iota, bytesFromHandle, decryptBytes, parseMessage } from "../util";

var ByteBuffer = Forge.util.ByteBuffer;
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
        var trytes = parseMessage(chunk);
        var bytes = iota.utils.fromTrytes(trytes);

        // odd tryte count. assume treasure and continue
        if (!bytes) {
          return callback();
        }
        byteBuffer = new ByteBuffer(bytes, "binary");
      }

      var decrypted = decryptBytes(this.key, byteBuffer);
      if (decrypted) {
        callback(null, decrypted);
      } else {
        // could not decrypt. assume treasure and continue
        callback();
      }
    }
  }]);

  return DecryptStream;
}(Transform);

export default DecryptStream;