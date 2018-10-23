import fs from "fs";

import Upload, { EVENTS } from "./upload";

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
      invoice: invoiceStub
    })
  );

test("Upload.fromFile emits the expected events", done => {
  readTestFile().then(file => {
    const opts = {
      alpha: "alpha",
      beta: "beta",
      epochs: 1,
      iotaProvider: "http://fake-iota.com",
      testEnv: true,
      createUploadSession: createUploadSessionStub
    };
    const u = Upload.fromFile(file, opts);
    expect.assertions(4);

    u.on(EVENTS.INVOICE, invoice => {
      expect(invoice).toEqual(invoiceStub);
    });

    u.on(EVENTS.PAYMENT_PENDING, () => {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    u.on(EVENTS.PAYMENT_CONFIRMED, paymentConfirmation => {
      expect(paymentConfirmation).toMatchObject({
        filename: "ditto.png",
        numberOfChunks: 17
      });
      expect(paymentConfirmation).toHaveProperty("handle"); // This has randomness
    });

    // TODO: These have been moved to uploadProgess.js
    // u.on(EVENTS.UPLOAD_PROGRESS, progress => {
    //   expect(progress).toEqual({ progress: 0.123 });
    // });
    // u.on(EVENTS.FINISH, done);

    u.on(EVENTS.RETRIEVED, done);
    u.on(EVENTS.ERROR, done.fail);
  });
});

test("Upload.fromData emits the expected events", done => {
  readTestData().then(data => {
    const opts = {
      alpha: "alpha",
      beta: "beta",
      epochs: 1,
      iotaProvider: "http://fake-iota.com",
      testEnv: true,
      createUploadSession: createUploadSessionStub
    };
    const u = Upload.fromData(data, "foobar.png", opts);
    expect.assertions(4);

    u.on(EVENTS.INVOICE, invoice => {
      expect(invoice).toEqual(invoiceStub);
    });

    u.on(EVENTS.PAYMENT_PENDING, () => {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    u.on(EVENTS.PAYMENT_CONFIRMED, paymentConfirmation => {
      expect(paymentConfirmation).toMatchObject({
        filename: "foobar.png",
        numberOfChunks: 7
      });
      expect(paymentConfirmation).toHaveProperty("handle"); // This has randomness
    });

    u.on(EVENTS.RETRIEVED, done);
    u.on(EVENTS.ERROR, done.fail);
  });
});
