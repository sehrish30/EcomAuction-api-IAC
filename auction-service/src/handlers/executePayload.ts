import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: process.env.REGION,
});

// query information of uploaded data
const executePayload = async (event: S3Event) => {
  try {
    const s3Event = event.Records[0].s3;

    const input = {
      Bucket: process.env.LISTING_AGREEMENT_BUCKET_NAME,
      Key: s3Event.object.key,
    };
    const command = new GetObjectCommand(input);
    const response = await client.send(command);
    console.log({ s3Eventey: s3Event.object });
    // save the listing name in dynamo db anything according business logic
    return JSON.stringify({
      message: "Agreement has been uploaded by user",
      object: s3Event.object.key,
    });
  } catch (err) {
    console.log(err);
    return JSON.stringify({
      err,
    });
  }
};

export const handler = executePayload;

/**
 * sls logs -f executePayload
 * sls deploy function --function executePayload
 */
