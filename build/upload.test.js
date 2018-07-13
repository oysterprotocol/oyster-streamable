import fs from "fs";

import Upload, { EVENTS } from "./upload";

var testFilePath = __dirname + "/../test-files/ditto.png";

var readTestFile = function readTestFile() {
  return new Promise(function (resolve, reject) {
    fs.readFile(testFilePath, function (err, data) {
      if (err) return reject(err);
      var blob = new File(data, "ditto.png");
      return resolve(blob);
    });
  });
};

var invoiceStub = { cost: 123, ethAddress: "testAddr" };
var createUploadSessionStub = function createUploadSessionStub() {
  return new Promise(function (resolve, reject) {
    return resolve({
      alphaSessionId: "alphaId",
      betaSessionId: "betaId",
      invoice: invoiceStub
    });
  });
};

test("Upload emits the expected events", function (done) {
  readTestFile().then(function (file) {
    var opts = {
      alpha: "alpha",
      beta: "beta",
      epochs: 1,
      iotaProvider: "http://fake-iota.com",
      testEnv: true,
      createUploadSession: createUploadSessionStub
    };
    var u = Upload.fromFile(file, opts);
    expect.assertions(5);

    u.on(EVENTS.INVOICE, function (invoice) {
      expect(invoice).toEqual(invoiceStub);
    });

    u.on(EVENTS.PAYMENT_PENDING, function () {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    u.on(EVENTS.PAYMENT_CONFIRMED, function (paymentConfirmation) {
      expect(paymentConfirmation).toMatchObject({
        filename: "ditto.png",
        numberOfChunks: 17
      });
      expect(paymentConfirmation).toHaveProperty("handle"); // This has randomness
    });

    u.on(EVENTS.UPLOAD_PROGRESS, function (progress) {
      expect(progress).toEqual({ progress: 0.123 });
    });

    u.on(EVENTS.ERROR, done.fail);
    u.on(EVENTS.FINISH, done);
  });
});