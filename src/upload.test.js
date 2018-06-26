import fs from "fs";

import Upload, { EVENTS } from "./upload";

const testFilePath = `${__dirname}/../test-files/ditto.png`;

const readTestFile = () =>
  new Promise((resolve, reject) => {
    fs.readFile(testFilePath, (err, data) => {
      if (err) return reject(err);
      const blob = new File(data, "ditto.png");
      return resolve(blob);
    });
  });

test("Upload emits the expected events", done => {
  readTestFile().then(file => {
    const u = Upload.fromFile(file, { testEnv: true });
    expect.assertions(5);

    u.on(EVENTS.INVOICE, invoice => {
      expect(invoice).toEqual({ cost: 123, ethAddress: "testAddr" });
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

    u.on(EVENTS.UPLOAD_PROGRESS, progress => {
      expect(progress).toEqual({ progress: 0.123 });
    });

    u.on(EVENTS.ERROR, done.fail);
    u.on(EVENTS.FINISH, done);
  });
});
