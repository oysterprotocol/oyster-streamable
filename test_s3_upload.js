const Oyster = require("./src/index");

Oyster.S3.config.update({
  accessKeyId: "...",
  secretAccessKey: "..."
});

const params = {
  Bucket: `oyster-uploads/testing/alpha`,
  Key: `testing1.json`,
  Body: JSON.stringify({ hey: "cool" })
};

Oyster.S3.upload(
  params,
  {},
  (err, data) =>
    !!err
      ? console.error("errorrrrrrrrrrrr: ", err)
      : console.log("successssssssss: ", data)
);
