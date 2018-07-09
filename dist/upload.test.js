"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _upload = require("./upload");

var _upload2 = _interopRequireDefault(_upload);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var testFilePath = __dirname + "/../test-files/ditto.png";

var readTestFile = function readTestFile() {
  return new Promise(function (resolve, reject) {
    _fs2.default.readFile(testFilePath, function (err, data) {
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
    var u = _upload2.default.fromFile(file, opts);
    expect.assertions(5);

    u.on(_upload.EVENTS.INVOICE, function (invoice) {
      expect(invoice).toEqual(invoiceStub);
    });

    u.on(_upload.EVENTS.PAYMENT_PENDING, function () {
      expect(true).toEqual(true); // Just testing if this event is emitted.
    });

    u.on(_upload.EVENTS.PAYMENT_CONFIRMED, function (paymentConfirmation) {
      expect(paymentConfirmation).toMatchObject({
        filename: "ditto.png",
        numberOfChunks: 17
      });
      expect(paymentConfirmation).toHaveProperty("handle"); // This has randomness
    });

    u.on(_upload.EVENTS.UPLOAD_PROGRESS, function (progress) {
      expect(progress).toEqual({ progress: 0.123 });
    });

    u.on(_upload.EVENTS.ERROR, done.fail);
    u.on(_upload.EVENTS.FINISH, done);
  });
});