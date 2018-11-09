"use strict";

var _readableStream = require("readable-stream");

var _filePreviewStream = require("./filePreviewStream");

var _filePreviewStream2 = _interopRequireDefault(_filePreviewStream);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

test("FilePreviewStream extends Writable", function() {
  expect(new _filePreviewStream2.default()).toBeInstanceOf(
    _readableStream.Writable
  );
});

test("constructor", function() {
  var metadata = { foo: "bar" };
  var options = { bar: "foo" };
  var filePreviewStream = new _filePreviewStream2.default(metadata, options);
  expect(filePreviewStream.metadata).toEqual(metadata);
  expect(filePreviewStream.options).toEqual(options);
  expect(filePreviewStream.fileChunks).toEqual([]);
  expect(filePreviewStream.file).toBeNull();
});

test("_write pushes data into fileChunks", function() {
  var filePreviewStream = new _filePreviewStream2.default();
  var data = Buffer.from("foo");
  filePreviewStream._write(data, "utf-8", function() {});

  expect(filePreviewStream.fileChunks).toEqual([data]);
});

test("_write invokes the callback function", function() {
  var filePreviewStream = new _filePreviewStream2.default();
  var data = Buffer.from("foo");
  var callback = jest.fn();
  filePreviewStream._write(data, "utf-8", callback);

  expect(callback).toHaveBeenCalled();
});

test("_final sets the result to a buffer", function() {
  var filePreviewStream = new _filePreviewStream2.default();
  var data = Buffer.from("foo");

  filePreviewStream.metadata = { ext: "rtf" };
  filePreviewStream.fileChunks = [data];
  filePreviewStream._final(function() {});

  var expectedResult = new Blob([data], { type: "application/rtf" });
  expect(filePreviewStream.result).toEqual(expectedResult);
});

test("_final invokes the callback function", function() {
  var filePreviewStream = new _filePreviewStream2.default();
  var data = Buffer.from("foo");
  var callback = jest.fn();

  filePreviewStream.metadata = { ext: "rtf" };
  filePreviewStream.fileChunks = [data];
  filePreviewStream._final(callback);

  expect(callback).toHaveBeenCalled();
});
