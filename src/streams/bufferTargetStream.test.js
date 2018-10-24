import fs from "fs";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { Writable } from "readable-stream";

import BufferTargetStream from "./bufferTargetStream";

test("BufferTargetStream extends Writable", () => {
  expect(new BufferTargetStream()).toBeInstanceOf(Writable);
});

test("constructor", () => {
  const metadata = { foo: "bar" };
  const options = { bar: "foo" };
  const bufferTargetStream = new BufferTargetStream(metadata, options);
  expect(bufferTargetStream.metadata).toEqual(metadata);
  expect(bufferTargetStream.options).toEqual(options);
  expect(bufferTargetStream.chunks).toEqual([]);
  expect(bufferTargetStream.totalLength).toEqual(0);
});

test("_write pushes data into chunks", () => {
  const bufferTargetStream = new BufferTargetStream();
  const data = ["foo", "bar"];
  bufferTargetStream._write(data, "utf-8", () => {});

  expect(bufferTargetStream.chunks).toEqual([data]);
});

test("_write adds data length to total length", () => {
  const bufferTargetStream = new BufferTargetStream();
  const data = ["foo", "bar"];
  bufferTargetStream._write(data, "utf-8", () => {});

  expect(bufferTargetStream.totalLength).toEqual(2);
});

test("_write invokes the callback function", () => {
  const bufferTargetStream = new BufferTargetStream();
  const callback = jest.fn();
  bufferTargetStream._write([], "utf-8", callback);

  expect(callback).toHaveBeenCalled();
});
