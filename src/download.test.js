import fs from "fs";

import Download, { EVENTS } from "./download";

const TEST_FILE_PATH = `${__dirname}/../test-files/ditto.png`;

const readTestFile = () =>
  new Promise((resolve, reject) => {
    fs.readFile(TEST_FILE_PATH, (err, data) => {
      if (err) return reject(err);
      const blob = new File(data, "ditto.png");
      return resolve(blob);
    });
  });

const readTestData = () =>
  new Promise((resolve, reject) => {
    fs.readFile(TEST_FILE_PATH, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });

const invoiceStub = { cost: 123, ethAddress: "testAddr" };
const createUploadSessionStub = () =>
  new Promise((resolve, reject) =>
    resolve({
      alphaSessionId: "alphaId",
      betaSessionId: "betaId",
      invoice: invoiceStub,
    })
  );

const TEST_HANDLE =
  "testfile7f024ff384bbeeecd959bd8dcd9306cf2fae397853a2c2e85866f28cb55187952kCPiaAU";

test("Download.toBuffer emits the expected events", done => {
  const d = Download.toBuffer(TEST_HANDLE, {
    iotaProviders: [
      { provider: "https://poll.oysternodes.com:14265/" },
      { provider: "https://download.oysternodes.com:14265/" },
    ],
  });
  expect.assertions(2);

  d.on(EVENTS.METADATA, invoice => {
    expect(invoice).toEqual({
      ext: "rtf",
      fileName: "test-file.rtf",
      numberOfChunks: 1,
    });
  });

  d.on(EVENTS.DOWNLOAD_PROGRESS, ({ progress }) => {
    expect(progress).toEqual(100);
  });

  d.on(EVENTS.FINISH, () => done());
});
