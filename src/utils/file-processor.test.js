import * as fileProcessor from "./file-processor.js";

test("createMetaData without custom params", () => {
  const fileName = "foobar.txt";
  const numberOfChunks = 10;

  expect(fileProcessor.createMetaData({ fileName, numberOfChunks })).toEqual({
    fileName: "foobar.txt",
    ext: "txt",
    numberOfChunks,
    custom: {}
  });
});

test("createMetaData with custom params", () => {
  const fileName = "foobar.txt";
  const numberOfChunks = 10;
  const custom = { foo: "bar" };

  expect(
    fileProcessor.createMetaData({ fileName, numberOfChunks, custom })
  ).toEqual({
    fileName: "foobar.txt",
    ext: "txt",
    numberOfChunks,
    custom
  });
});
