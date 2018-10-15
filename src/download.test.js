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
  "skinrtfBab22a552f043d87490334ad7aa55e7bbef7dccbad59fc1d8dfe812c61af01f993iZcVrtB";

test("Download.toBuffer emits the expected events", done => {
  readTestFile().then(file => {
    const d = Download.toBuffer(TEST_HANDLE, {
      iotaProviders: [
        { provider: "https://poll.oysternodes.com:14265/" },
        { provider: "https://download.oysternodes.com:14265/" },
      ],
    });
    expect.assertions(4);

    d.on(EVENTS.METADATA, invoice => {
      expect(invoice).toEqual(invoiceStub);
    });

    d.on(EVENTS.DOWNLOAD_PROGRESS, () => {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    d.on(EVENTS.FINISHED, done);
    d.on(EVENTS.ERROR, done.fail);
  });
});
