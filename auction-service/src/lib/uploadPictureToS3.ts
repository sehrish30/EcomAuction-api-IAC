import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import createError from "http-errors";

const client = new S3Client({
  region: "us-east-2",
});

export async function uploadPictureToS3(key: string, body: Buffer, contentType?: string) {
  // key is the name of the file
  // body is going to be actual data we are going to upload
  const command = new PutObjectCommand({
    Bucket: process.env.AUCTIONS_BUCKET_NAME,
    Body: body,
    Key: key,
    ContentEncoding: "base64",
    ContentType: contentType || "image/jpeg",
  });
  try {
    const response = await client.send(command);
    // response.ETag = 3f41e6f6-6349-4976-a6df-502a7a29ab17
    console.log({ response });
    return key;
  } catch (err) {
    const { requestId, cfId, extendedRequestId } = err.$metadata;
    console.log({ requestId, cfId, extendedRequestId });
    throw new createError.InternalServerError(err);
  }
}
// can call in frontend like this
// https://auctions-bucket-sdsjj32kjds-dev.s3.us-east-2.amazonaws.com/2997905a-e700-4797-88ac-d2208171ee98.jpg
