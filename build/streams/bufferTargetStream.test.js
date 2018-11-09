"use strict";

var _readableStream = require("readable-stream");

var _bufferTargetStream = require("./bufferTargetStream");

var _bufferTargetStream2 = _interopRequireDefault(_bufferTargetStream);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

test("BufferTargetStream extends Writable", function() {
  expect(new _bufferTargetStream2.default()).toBeInstanceOf(
    _readableStream.Writable
  );
});

test("constructor", function() {
  var metadata = { foo: "bar" };
  var options = { bar: "foo" };
  var bufferTargetStream = new _bufferTargetStream2.default(metadata, options);
  expect(bufferTargetStream.metadata).toEqual(metadata);
  expect(bufferTargetStream.options).toEqual(options);
  expect(bufferTargetStream.chunks).toEqual([]);
  expect(bufferTargetStream.totalLength).toEqual(0);
});

test("_write pushes data into chunks", function() {
  var bufferTargetStream = new _bufferTargetStream2.default();
  var data = Buffer.from("foo");
  bufferTargetStream._write(data, "utf-8", function() {});

  expect(bufferTargetStream.chunks).toEqual([data]);
});

test("_write adds data length to total length", function() {
  var bufferTargetStream = new _bufferTargetStream2.default();
  var data = Buffer.from("foo");
  bufferTargetStream._write(data, "utf-8", function() {});

  expect(bufferTargetStream.totalLength).toEqual(3);
});

test("_write invokes the callback function", function() {
  var bufferTargetStream = new _bufferTargetStream2.default();
  var callback = jest.fn();
  bufferTargetStream._write([], "utf-8", callback);

  expect(callback).toHaveBeenCalled();
});

test("_write adds data length to total length", function() {
  var bufferTargetStream = new _bufferTargetStream2.default();
  var data = Buffer.from("foo");
  bufferTargetStream._write(data, "utf-8", function() {});

  expect(bufferTargetStream.totalLength).toEqual(3);
});

test("_final sets the result to a buffer", function() {
  var bufferTargetStream = new _bufferTargetStream2.default();
  var data = Buffer.from("foo");

  bufferTargetStream.chunks = [data];
  bufferTargetStream.totalLength = 2;
  bufferTargetStream._final(function() {});

  var expectedResult = new Buffer.concat([data], 2);
  expect(bufferTargetStream.result).toEqual(expectedResult);
});
