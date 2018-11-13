"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function() {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (
        var _i = arr[Symbol.iterator](), _s;
        !(_n = (_s = _i.next()).done);
        _n = true
      ) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function(arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError(
        "Invalid attempt to destructure non-iterable instance"
      );
    }
  };
})();

exports.generate = generate;
exports.offsetHash = offsetHash;
exports.getNextHash = getNextHash;

var _encryption = require("./encryption");

var encryption = _interopRequireWildcard(_encryption);

var _util = require("../util");

var _config = require("../config");

var _util2 = require("node-forge/lib/util");

var _util3 = _interopRequireDefault(_util2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
          newObj[key] = obj[key];
      }
    }
    newObj.default = obj;
    return newObj;
  }
}

function generate(handle, size) {
  var offsets = 1; // Meta chunk

  // Includes 1 treasure per sector.
  var numTreasureChunks = Math.ceil(
    size / (_config.FILE.CHUNKS_PER_SECTOR - 1)
  );
  offsets += numTreasureChunks;

  var keys = Array.from(Array(size + offsets), function(_, i) {
    return i;
  });

  var _keys$reduce = keys.reduce(
      function(_ref, i) {
        var _ref2 = _slicedToArray(_ref, 2),
          dataM = _ref2[0],
          hash = _ref2[1];

        var _encryption$hashChain = encryption.hashChain(hash),
          _encryption$hashChain2 = _slicedToArray(_encryption$hashChain, 2),
          obfuscatedHash = _encryption$hashChain2[0],
          nextHash = _encryption$hashChain2[1];

        dataM[i] = _util.iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
        return [dataM, nextHash];
      },
      [{}, encryption.genesisHash(handle)]
    ),
    _keys$reduce2 = _slicedToArray(_keys$reduce, 1),
    dataMap = _keys$reduce2[0];

  return dataMap;
}

function offsetHash(hash, offset) {
  var nextHash = hash;
  var obfuscatedHash = void 0;

  do {
    var _encryption$hashChain3 = encryption.hashChain(nextHash);

    var _encryption$hashChain4 = _slicedToArray(_encryption$hashChain3, 2);

    obfuscatedHash = _encryption$hashChain4[0];
    nextHash = _encryption$hashChain4[1];
  } while (--offset > 0);

  return _util.iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
}

function getNextHash(hash) {
  var hashChain = encryption.hashChain(_util3.default.hexToBytes(hash));
  return _util3.default.bytesToHex(hashChain[1]);
}
