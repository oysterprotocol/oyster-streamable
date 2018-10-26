import { Writable } from "readable-stream";

import FilePreviewStream from "./filePreviewStream";

test("FilePreviewStream extends Writable", () => {
  expect(new FilePreviewStream()).toBeInstanceOf(Writable);
});

test("constructor", () => {
  const metadata = { foo: "bar" };
  const options = { bar: "foo" };
  const filePreviewStream = new FilePreviewStream(metadata, options);
  expect(filePreviewStream.metadata).toEqual(metadata);
  expect(filePreviewStream.options).toEqual(options);
  expect(filePreviewStream.fileChunks).toEqual([]);
  expect(filePreviewStream.file).toBeNull();
});

test("_write pushes data into fileChunks", () => {
  const filePreviewStream = new FilePreviewStream();
  const data = Buffer.from("foo");
  filePreviewStream._write(data, "utf-8", () => {});

  expect(filePreviewStream.fileChunks).toEqual([data]);
});

test("_write invokes the callback function", () => {
  const filePreviewStream = new FilePreviewStream();
  const data = Buffer.from("foo");
  const callback = jest.fn();
  filePreviewStream._write(data, "utf-8", callback);

  expect(callback).toHaveBeenCalled();
});

test("_final sets the result to a buffer", () => {
  const filePreviewStream = new FilePreviewStream();
  const data = Buffer.from("foo");

  filePreviewStream.metadata = { ext: "rtf" };
  filePreviewStream.fileChunks = [data];
  filePreviewStream._final(() => {});

  const expectedResult = new Blob([data], { type: "application/rtf" });
  expect(filePreviewStream.result).toEqual(expectedResult);
});

test("_final invokes the callback function", () => {
  const filePreviewStream = new FilePreviewStream();
  const data = Buffer.from("foo");
  const callback = jest.fn();

  filePreviewStream.metadata = { ext: "rtf" };
  filePreviewStream.fileChunks = [data];
  filePreviewStream._final(callback);

  expect(callback).toHaveBeenCalled();
});
