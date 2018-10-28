import * as fileProcessor from "./file-processor.js";

test("createMetaData", () => {
  const fileName = "foobar.txt";
  const numberOfChunks = 10;

  expect(fileProcessor.createMetaData({ fileName, numberOfChunks })).toEqual({
    fileName: "foobar.txt",
    ext: "txt",
    numberOfChunks
  });
});
