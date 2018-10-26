import { Transform } from "readable-stream";
import Datamap from "datamap-generator";

import EncryptStream from "./encryptStream";
import { bytesFromHandle } from "../util";

test("EncryptStream extends Transform", () => {
  const handle = "foobar";
  const options = { foo: "bar" };
  const encryptStream = new EncryptStream(handle, options);
  expect(encryptStream).toBeInstanceOf(Transform);
});

test("constructor", () => {
  const handle = "foobar";
  const options = { foo: "bar" };
  const encryptStream = new EncryptStream(handle, options);

  expect(encryptStream.options).toEqual({ objectMode: true, ...options });
  expect(encryptStream.key).toEqual(bytesFromHandle(handle));
  expect(encryptStream.genesisHash).toEqual(Datamap.genesisHash(handle));
});

test("_transform invokes the callback", () => {
  const chunk = { idx: 1 };
  const callback = jest.fn();

  const handle = "foobar";
  const options = { foo: "bar" };
  const encryptStream = new EncryptStream(handle, options);

  encryptStream._transform(chunk, "utf-8", callback);

  expect(callback).toHaveBeenCalled();
});

test("_transform invokes the callback", () => {
  const chunk = { idx: 1 };
  const callback = jest.fn();

  const handle = "foobar";
  const options = { foo: "bar" };
  const encryptStream = new EncryptStream(handle, options);

  encryptStream._transform(chunk, "utf-8", callback);

  const expectedChunk = {
    data: "E9UBOHMCD9LEIBCES9JEFGZEIDJIF9CFHCWGQBOCMEYCJIB9M9L9KGSFFELFLINHA",
    idx: 1
  };
  expect(callback).toHaveBeenCalledWith(null, expectedChunk);
});
