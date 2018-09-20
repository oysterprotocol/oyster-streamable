import AWS from "aws-sdk";

const s3 = new AWS.S3();

export default {
  config: AWS.config,
  upload: s3.upload
};
