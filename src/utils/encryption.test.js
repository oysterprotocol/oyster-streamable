import * as encryption from "./encryption.js";
import * as util from "../util";

const handle =
  "aatxtX7w7d4aaecf55ce9e0b62f18f38008ffdbb74d67719fc9de5ac9b0fa4715882e1baBczPzy8k";

test("encryption getSalt", () => {
  const expectedLength = 15;
  const salt = encryption.getSalt(expectedLength);

  expect(salt.length).toEqual(expectedLength);
  expect(typeof salt).toBe("string");
  expect(salt).not.toEqual(null);
});

test("encryption getPrimordialHash", () => {
  const expectedLength = 64;
  const hash = encryption.getPrimordialHash();

  expect(hash.length).toEqual(expectedLength);
  expect(typeof hash).toBe("string");
  expect(hash).not.toEqual(null);
});

test("encryption deriveNonce", () => {
  const expectedLength = 16;
  const key = util.bytesFromHandle(handle);
  //const hash = encryption.deriveNonce(key, 11);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption hashChain", () => {
  const expectedLength = 16;
  const bytes = util.bytesFromHandle(handle);
  //const hash = encryption.hashChain(bytes);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption genesisHash", () => {
  const expectedLength = 64;
  //const hash = encryption.genesisHash(handle);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption obfuscatedGenesisHash", () => {
  const expectedLength = 64;
  //const hash = encryption.obfuscatedGenesisHash(handle);

  //expect(hash.length).toEqual(expectedLength);
  //expect(typeof hash).toBe("string");
  //expect(hash).not.toEqual(null);
});

test("encryption createHandle", () => {
  const expectedLength = 80;
  const hash = encryption.createHandle(handle);

  expect(hash.length).toEqual(expectedLength);
  expect(typeof hash).toBe("string");
  expect(hash).not.toEqual(null);
});
