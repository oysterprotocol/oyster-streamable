var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import { hashChain, genesisHash } from "./encryption";
import { iota } from "../util";
import { FILE } from "../config";

export function generate(handle, size) {
  var offsets = 1; // Meta chunk

  // Includes 1 treasure per sector.
  var numTreasureChunks = Math.ceil(size / (FILE.CHUNKS_PER_SECTOR - 1));
  offsets += numTreasureChunks;

  var keys = Array.from(Array(size + offsets), function (_, i) {
    return i;
  });

  var _keys$reduce = keys.reduce(function (_ref, i) {
    var _ref2 = _slicedToArray(_ref, 2),
        dataM = _ref2[0],
        hash = _ref2[1];

    var _hashChain = hashChain(hash),
        _hashChain2 = _slicedToArray(_hashChain, 2),
        obfuscatedHash = _hashChain2[0],
        nextHash = _hashChain2[1];

    dataM[i] = iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
    return [dataM, nextHash];
  }, [{}, genesisHash(handle)]),
      _keys$reduce2 = _slicedToArray(_keys$reduce, 1),
      dataMap = _keys$reduce2[0];

  return dataMap;
}

export function offsetHash(hash, offset) {
  var nextHash = hash;
  var obfuscatedHash = void 0;

  do {
    var _hashChain3 = hashChain(nextHash);

    var _hashChain4 = _slicedToArray(_hashChain3, 2);

    obfuscatedHash = _hashChain4[0];
    nextHash = _hashChain4[1];
  } while (--offset > 0);

  return iota.utils.toTrytes(obfuscatedHash).substr(0, 81);
}