"use strict";

var _typeof =
  typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? function(obj) {
        return typeof obj;
      }
    : function(obj) {
        return obj &&
          typeof Symbol === "function" &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
          ? "symbol"
          : typeof obj;
      };

var _encryption = require("./encryption.js");

var encryption = _interopRequireWildcard(_encryption);

var _util = require("../util");

var util = _interopRequireWildcard(_util);

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

var handle =
  "aatxtX7w7d4aaecf55ce9e0b62f18f38008ffdbb74d67719fc9de5ac9b0fa4715882e1baBczPzy8k";

test("encryption getSalt", function() {
  var expectedLength = 15;
  var salt = encryption.getSalt(expectedLength);

  expect(salt.length).toEqual(expectedLength);
  expect(typeof salt === "undefined" ? "undefined" : _typeof(salt)).toBe(
    "string"
  );
  expect(salt).not.toEqual(null);
});

test("encryption getPrimordialHash", function() {
  var expectedLength = 64;
  var hash = encryption.getPrimordialHash();

  expect(hash.length).toEqual(expectedLength);
  expect(typeof hash === "undefined" ? "undefined" : _typeof(hash)).toBe(
    "string"
  );
  expect(hash).not.toEqual(null);
});

test("encryption deriveNonce", function() {
  var expectedLength = 16;
  var key = util.bytesFromHandle(handle);
  //const hash = encryption.deriveNonce(key, 11);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption hashChain", function() {
  var expectedLength = 16;
  var bytes = util.bytesFromHandle(handle);
  //const hash = encryption.hashChain(bytes);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption genesisHash", function() {
  var expectedLength = 64;
  //const hash = encryption.genesisHash(handle);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption obfuscatedGenesisHash", function() {
  var expectedLength = 64;
  //const hash = encryption.obfuscatedGenesisHash(handle);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption createHandle", function() {
  var expectedLength = 80;
  var hash = encryption.createHandle(handle);

  expect(hash.length).toEqual(expectedLength);
  expect(typeof hash === "undefined" ? "undefined" : _typeof(hash)).toBe(
    "string"
  );
  expect(hash).not.toEqual(null);
});
