import * as util from "./util.js";

import ForgeCipher from "node-forge/lib/cipher";
import ForgeMd from "node-forge/lib/md";
import ForgeUtil from "node-forge/lib/util";

const STOPPER_TRYTE = "A";

const handle =
  "aatxtX7w7d4aaecf55ce9e0b62f18f38008ffdbb74d67719fc9de5ac9b0fa4715882e1baBczPzy8k";
const encoding = "utf8";

const Forge = { cipher: ForgeCipher, md: ForgeMd, util: ForgeUtil };

test("util bytesFromHandle", () => {
  const expected = Forge.md.sha256
    .create()
    .update(handle, "utf8")
    .digest();
  expect(util.bytesFromHandle(handle)).toEqual(expected);
});

test("util s3FolderFromGenesisHash", () => {
  const expected = Forge.md.sha256
    .create()
    .update(handle, "utf8")
    .digest();
  expect(util.s3FolderFromGenesisHash(handle)).toEqual(expected);
});

// TODO
test("util offsetHash", () => {
  //const expected = "aa";
  //expect(util.offsetHash(handle, offset)).toEqual(expected);
});

test("util addStopperTryte", () => {
  const expected = handle + STOPPER_TRYTE;
  expect(util.addStopperTryte(handle)).toEqual(expected);
});

test("util parseMessage", () => {
  let expected = "";
  expect(util.parseMessage(handle)).toEqual(expected);

  expected = "AbAAAAAAAAfadfasdfAAF";
  expect(util.parseMessage("AbAAAAAAAAfadfasdfAAFASfdsf")).toEqual(expected);
});

test("util encrypt", () => {
  const key = util.bytesFromHandle(handle);
  const binaryString = Forge.util.createBuffer("string", encoding);
  const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  expect(util.encrypt(key, 0, binaryString)).toEqual(expected);
});

test("util encryptString", () => {
  const key = util.bytesFromHandle(handle);
  const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  expect(util.encryptString(key, 0, "string", encoding)).toEqual(expected);
});

test("util encryptBytes", () => {
  const key = util.bytesFromHandle(handle);
  const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  expect(util.encryptBytes(key, 0, "string")).toEqual(expected);
});

// TODO
test("util encryptMetadata", () => {
  //const key = util.bytesFromHandle(handle);
  //const metadata = Forge.util.createBuffer("string", encoding);;
  //const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  //expect(util.encryptMetadata(metadata, key)).toEqual(expected);
});

test("util decrypt", () => {
  const key = util.bytesFromHandle(handle);
  const byteBuffer = Forge.util.createBuffer(
    "11112222333344445555666677778888",
    encoding
  );
  expect(util.decrypt(key, byteBuffer)).toEqual(false);
});

test("util decryptBytes", () => {
  const key = util.bytesFromHandle(handle);
  const byteBuffer = Forge.util.createBuffer(
    "11112222333344445555666677778888",
    encoding
  );
  expect(util.decryptBytes(key, byteBuffer)).toEqual(false);
});

// TODO test to true
test("util decryptString", () => {
  const key = util.bytesFromHandle(handle);
  const byteBuffer = Forge.util.createBuffer(
    "11112222333344445555666677778888",
    encoding
  );
  expect(util.decryptString(key, byteBuffer, encoding)).toEqual(false);
});

// TODO test to true
test("util decryptString", () => {
  const key = util.bytesFromHandle(handle);
  const byteBuffer = Forge.util.createBuffer(
    "11112222333344445555666677778888",
    encoding
  );
  expect(util.decryptString(key, byteBuffer, encoding)).toEqual(false);
});

// TODO and TODO test to true
test("util decryptMetadata", () => {
  //const key = util.bytesFromHandle(handle);
  //const signature = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  //const expected = "SBPGPBS9PDABWAAGLGRHSHKB9I9IEILFAIBFLGREC99Enull";
  //expect(util.decryptMetadata(key, signature)).toEqual(false);
});

test("util getVersion", () => {
  const byteBuffer = Forge.util.createBuffer(
    "11112222333344445555666677778888",
    encoding
  );
  const expected = 825307441;
  expect(util.getVersion(byteBuffer)).toEqual(expected);
});

test("util versionTrytes", () => {
  const expected = "999999A9";
  expect(util.versionTrytes()).toEqual(expected);
});
