const uuid = require("uuid/v1");
const aws = require("aws-sdk");

const { S3_ENDPOINT, S3_BUCKET, S3_KEY, S3_ACCESS } = process.env;

const s3 = new aws.S3({
  accessKeyId: S3_KEY,
  secretAccessKey: S3_ACCESS,
  params: {
    Bucket: S3_BUCKET
  },
  endpoint: new aws.Endpoint(S3_ENDPOINT) // fake s3 endpoint for local dev
});

exports.processUpload = async (upload, ctx) => {
  if (!upload) {
    throw Error("No file received.");
  }

  const { filename, mimetype, encoding, createReadStream } = await upload;
  let filesize = 0;
  let stream = createReadStream();
  stream.on("data", chunk => {
    filesize += chunk.length;
  });

  const key = uuid() + "-" + filename;

  if (filesize > 20000) {
    throw Error("File is to large");
  }

  // Upload to S3
  const response = await s3
    .upload({
      Key: key,
      ACL: "public-read",
      Body: stream
    })
    .promise();

  const url = response.Location;

  // Sync with Prisma
  const data = {
    filename,
    mimetype,
    encoding,
    url
  };

  return data;
};
