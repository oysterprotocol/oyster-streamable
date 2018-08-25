"use strict";

var _util = require("./util.js");

var util = _interopRequireWildcard(_util);

var _cipher = require("node-forge/lib/cipher");

var _cipher2 = _interopRequireDefault(_cipher);

var _md = require("node-forge/lib/md");

var _md2 = _interopRequireDefault(_md);

var _util2 = require("node-forge/lib/util");

var _util3 = _interopRequireDefault(_util2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var STOPPER_TRYTE = "A";

var handle = "aatxtX7w7d4aaecf55ce9e0b62f18f38008ffdbb74d67719fc9de5ac9b0fa4715882e1baBczPzy8k";
var encoding = "utf8";

var Forge = { cipher: _cipher2.default, md: _md2.default, util: _util3.default };

test("util bytesFromHandle", function () {
  var expected = Forge.md.sha256.create().update(handle, "utf8").digest();
  expect(util.bytesFromHandle(handle)).toEqual(expected);
});

// TODO
test("util offsetHash", function () {
  //const expected = "aa";
  //expect(util.offsetHash(handle, offset)).toEqual(expected);
});

test("util addStopperTryte", function () {
  var expected = handle + STOPPER_TRYTE;
  expect(util.addStopperTryte(handle)).toEqual(expected);
});

test("util parseMessage", function () {
  var expected = "";
  expect(util.parseMessage(handle)).toEqual(expected);

  expected = "AbAAAAAAAAfadfasdfAAF";
  expect(util.parseMessage("AbAAAAAAAAfadfasdfAAFASfdsf")).toEqual(expected);
});

test("util encrypt", function () {
  var key = util.bytesFromHandle(handle);
  var binaryString = Forge.util.createBuffer("string", encoding);
  var expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  expect(util.encrypt(key, 0, binaryString)).toEqual(expected);
});

test("util encryptString", function () {
  var key = util.bytesFromHandle(handle);
  var expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  expect(util.encryptString(key, 0, "string", encoding)).toEqual(expected);
});

test("util encryptBytes", function () {
  var key = util.bytesFromHandle(handle);
  var expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  expect(util.encryptBytes(key, 0, "string")).toEqual(expected);
});

// TODO
test("util encryptMetadata", function () {
  //const key = util.bytesFromHandle(handle);
  //const metadata = Forge.util.createBuffer("string", encoding);;
  //const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  //expect(util.encryptMetadata(metadata, key)).toEqual(expected);
});

test("util decrypt", function () {
  var key = util.bytesFromHandle(handle);
  var byteBuffer = Forge.util.createBuffer("11112222333344445555666677778888", encoding);
  expect(util.decrypt(key, byteBuffer)).toEqual(false);
});

test("util decryptBytes", function () {
  var key = util.bytesFromHandle(handle);
  var byteBuffer = Forge.util.createBuffer("11112222333344445555666677778888", encoding);
  expect(util.decryptBytes(key, byteBuffer)).toEqual(false);
});

// TODO test to true
test("util decryptString", function () {
  var key = util.bytesFromHandle(handle);
  var byteBuffer = Forge.util.createBuffer("11112222333344445555666677778888", encoding);
  expect(util.decryptString(key, byteBuffer, encoding)).toEqual(false);
});

// TODO test to true
test("util decryptString", function () {
  var key = util.bytesFromHandle(handle);
  var byteBuffer = Forge.util.createBuffer("11112222333344445555666677778888", encoding);
  expect(util.decryptString(key, byteBuffer, encoding)).toEqual(false);
});

// TODO and TODO test to true
test("util decryptMetadata", function () {
  //const key = util.bytesFromHandle(handle);
  //const signature = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  //const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  //expect(util.decryptMetadata(key, signature)).toEqual(false);
});

test("util getVersion", function () {
  var byteBuffer = Forge.util.createBuffer("11112222333344445555666677778888", encoding);
  var expected = 825307441;
  expect(util.getVersion(byteBuffer)).toEqual(expected);
});

test("util versionTrytes", function () {
  var expected = "999999A9";
  expect(util.versionTrytes()).toEqual(expected);
});