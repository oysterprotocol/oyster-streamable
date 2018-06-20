import fs from "fs";

import Upload from "./upload";

const testFilePath = `${__dirname}/../test-files/ditto.png`;

const readTestFile = () =>
  new Promise((resolve, reject) => {
    fs.readFile(testFilePath, (err, data) => {
      if (err) return reject(err);
      const blob = new File(data, "ditto.png");
      return resolve(blob);
    });
  });

test("first test", done => {
  readTestFile().then(file => {
    const upload = Upload.fromFile(file, { testEnv: true });
    console.log(file);

    upload.on("done", done);
  });
  expect(true).toBe(true);
});
