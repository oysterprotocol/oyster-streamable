import AWS from "aws-sdk";

const upload = (...args) => {
  const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
  return s3.upload(...args);
};

export default {
  config: AWS.config,
  upload
};
