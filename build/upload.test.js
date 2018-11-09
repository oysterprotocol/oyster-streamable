"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _upload = require("./upload");

var _upload2 = _interopRequireDefault(_upload);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var TEST_FILE_PATH = __dirname + "/../test-files/ditto.png";

var readTestFile = function readTestFile() {
  return new Promise(function(resolve, reject) {
    _fs2.default.readFile(TEST_FILE_PATH, function(err, data) {
      if (err) return reject(err);
      var blob = new File(data, "ditto.png");
      return resolve(blob);
    });
  });
};

var readTestData = function readTestData() {
  return new Promise(function(resolve, reject) {
    _fs2.default.readFile(TEST_FILE_PATH, function(err, data) {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};

var invoiceStub = { cost: 123, ethAddress: "testAddr" };
var createUploadSessionStub = function createUploadSessionStub() {
  return new Promise(function(resolve, reject) {
    return resolve({
      alphaSessionId: "alphaId",
      betaSessionId: "betaId",
      invoice: invoiceStub
    });
  });
};

test("Upload.fromFile emits the expected events", function(done) {
  readTestFile().then(function(file) {
    var opts = {
      alpha: "alpha",
      beta: "beta",
      epochs: 1,
      iotaProvider: "http://fake-iota.com",
      testEnv: true,
      createUploadSession: createUploadSessionStub
    };
    var u = _upload2.default.fromFile(file, opts);
    expect.assertions(4);

    u.on(_upload.EVENTS.INVOICE, function(invoice) {
      expect(invoice).toEqual(invoiceStub);
    });

    u.on(_upload.EVENTS.PAYMENT_PENDING, function() {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    u.on(_upload.EVENTS.PAYMENT_CONFIRMED, function(paymentConfirmation) {
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

    u.on(_upload.EVENTS.META_ATTACHED, done);
    u.on(_upload.EVENTS.ERROR, done.fail);
  });
});

test("Upload.fromData emits the expected events", function(done) {
  readTestData().then(function(data) {
    var opts = {
      alpha: "alpha",
      beta: "beta",
      epochs: 1,
      iotaProvider: "http://fake-iota.com",
      testEnv: true,
      createUploadSession: createUploadSessionStub
    };
    var u = _upload2.default.fromData(data, "foobar.png", opts);
    expect.assertions(4);

    u.on(_upload.EVENTS.INVOICE, function(invoice) {
      expect(invoice).toEqual(invoiceStub);
    });

    u.on(_upload.EVENTS.PAYMENT_PENDING, function() {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    u.on(_upload.EVENTS.PAYMENT_CONFIRMED, function(paymentConfirmation) {
      expect(paymentConfirmation).toMatchObject({
        filename: "foobar.png",
        numberOfChunks: 7
      });
      expect(paymentConfirmation).toHaveProperty("handle"); // This has randomness
    });

    u.on(_upload.EVENTS.RETRIEVED, done);
    u.on(_upload.EVENTS.ERROR, done.fail);
  });
});
