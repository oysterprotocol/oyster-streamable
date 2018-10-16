import fs from "fs";
import nock from "nock";

import Download, { EVENTS } from "./download";

const TEST_HANDLE =
  "testfile7f024ff384bbeeecd959bd8dcd9306cf2fae397853a2c2e85866f28cb55187952kCPiaAU";

test("Download.toBuffer emits the expected events", done => {
  const mockIotaResponse = {
    data: { ixi: { signatures: { data: ["something"] } } }, // TODO: replace "something"
  };

  nock("https://poll.oysternodes.com:14265")
    .options("/")
    .reply(200, {});

  nock("https://poll.oysternodes.com:14265")
    .post("/")
    .reply(200, mockIotaResponse);

  nock("https://download.oysternodes.com:14265")
    .options("/", { headers: { origin: "blah" } })
    .reply(200, {});

  nock("https://download.oysternodes.com:14265")
    .post("/")
    .reply(200, mockIotaResponse);

  const d = Download.toBuffer(TEST_HANDLE, {
    iotaProviders: [
      { provider: "https://poll.oysternodes.com:14265/" },
      { provider: "https://download.oysternodes.com:14265/" },
    ],
  });
  expect.assertions(2);

  d.on(EVENTS.METADATA, metadata => {
    expect(metadata).toEqual({
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

// test("Download.toBlob emits the expected events", done => {
// const mockIotaResponse = {
// data: { ixi: { signatures: { data: ["something"] } } }, // TODO: replace "something"
// };

// nock("https://poll.oysternodes.com:14265")
// .options("/")
// .reply(200, {});

// nock("https://poll.oysternodes.com:14265")
// .post("/")
// .reply(200, mockIotaResponse);

// const d = Download.toBlog(TEST_HANDLE, {
// iotaProviders: [
// { provider: "https://poll.oysternodes.com:14265/" },
// { provider: "https://download.oysternodes.com:14265/" },
// ],
// });
// expect.assertions(2);

// d.on(EVENTS.METADATA, metadata => {
// expect(metadata).toEqual({
// ext: "rtf",
// fileName: "test-file.rtf",
// numberOfChunks: 1,
// });
// });

// d.on(EVENTS.DOWNLOAD_PROGRESS, ({ progress }) => {
// expect(progress).toEqual(100);
// });

// d.on(EVENTS.FINISH, () => done());
// });
