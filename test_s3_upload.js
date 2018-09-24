const Oyster = require("./src/index").default;
const Backend = require("./src/utils/backend");
const { sendToS3 } = Backend;

Oyster.S3.config.update({
  accessKeyId: "...",
  secretAccessKey: "..."
});

sendToS3("123abc", "genesisHash", [
  { idx: 1, data: "cool", genesisHash: "test" }
]);
