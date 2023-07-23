const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const keys = require("../config/keys");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const requireLogin = require("../middlewares/requireLogin");

const dotenv = require("dotenv");
dotenv.config();

// will check credentials in cli
const s3Client = new S3Client({
  region: "me-south-1",
  credentials: {
    accessKeyId: keys.accessKeyId,
    secretAccessKey: keys.secretAccessKey,
  },
});

// https://awspolicygen.s3.amazonaws.com/policygen.html

module.exports = (app) => {
  app.get("/api/upload", requireLogin, async (req, res) => {
    try {
      console.log("Test AWS");

      const fileType = req.query.fileType;

      const fileExt = fileType?.substring(fileType.indexOf("/") + 1) ?? "";

      const key = `${req.user.id}/${uuidv4()}.${fileExt}`;

      // folder is user
      const bucketParams = {
        Bucket: process.env.AWS_RESOURCE_BUCKET,
        Key: key, // name of the file we are uploading
        ContentType: fileType, // contentType of the file to upload
      };

      const command = new PutObjectCommand(bucketParams);
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      console.log(url);

      res.send({
        key,
        url,
      });
    } catch (e) {
      console.log("AWS PutBucket ERR");
      console.log(e);
      res.status(500).send(e);
    }
  });
};

/**
 * await axios.put(uploadConfig.data.url, file, {
    headers: {
      // same file type required for s3
      "Content-Type": file.type,
    },
  });
 */

/**
   * 
   * {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::asdf-images-bank/*"
        }
    ]
}
   */
