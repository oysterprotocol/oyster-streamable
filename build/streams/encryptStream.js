var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { Transform } from "readable-stream";
import { bytesFromHandle, encryptBytes, addStopperTryte } from "../util";
import { genesisHash, deriveNonce } from "../utils/encryption";

var DEFAULT_OPTIONS = Object.freeze({
  objectMode: true
});

var EncryptStream = function (_Transform) {
  _inherits(EncryptStream, _Transform);

  function EncryptStream(handle, options) {
    _classCallCheck(this, EncryptStream);

    var opts = Object.assign({}, DEFAULT_OPTIONS, options);

    var _this = _possibleConstructorReturn(this, (EncryptStream.__proto__ || Object.getPrototypeOf(EncryptStream)).call(this, opts));

    _this.options = opts;
    _this.key = bytesFromHandle(handle);
    _this.genesisHash = genesisHash(handle);
    return _this;
  }

  _createClass(EncryptStream, [{
    key: "_transform",
    value: function _transform(chunk, encoding, callback) {
      var key = this.key;
      var iv = deriveNonce(this.key, chunk.idx);

      chunk.data = addStopperTryte(encryptBytes(key, iv, chunk.data));

      callback(null, chunk);
    }
  }]);

  return EncryptStream;
}(Transform);

export default EncryptStream;