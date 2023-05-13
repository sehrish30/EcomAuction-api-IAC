import { APIGatewayEvent } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";
import { v4 as uuidv4 } from "uuid";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedUrlFromS3 } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: process.env.REGION,
});

const getSignedUrl = async (event: APIGatewayEvent) => {
  let url;
  const { email } = event.requestContext?.authorizer as { email: string };
  try {
    const bucket = process.env.LISTING_AGREEMENT_BUCKET_NAME;
    // key for the object im going to upload to this particular bucket
    // through signed url
    const key = uuidv4();

    // after 5 minutes signed url will expire
    /**
     * Better to deploy this in another service when exepecially ur generating getobject signed url
     * as this ttl will expire the access to this object
     * but if u r using cloudfront u need to make sure the cache time also expries before or same time signed url object
     * cache for security reasons as cloudfront will cache the image for long according to its ttl
     */
    const expireSeconds = 60 * 5; // 300s = 5 min

    // PutObjectCommand Why am I getting this signed url to put object
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "application/json", // Set ContentType as 'application/json'
    });

    // use this if you want to get object from signed url
    // const command1 = new GetObjectCommand({
    //     Bucket: bucket,
    //     Key: key,
    //     ResponseContentType: "application/json"
    // })

    // for this we need permission to putObject in s3 to generate pre signed url
    // @ts-ignore
    url = await getSignedUrlFromS3(client, command, {
      expiresIn: expireSeconds,
    });
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        err,
      }),
    };
  }
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      url,
      email,
    }),
  };
};

export const handler = commonMiddleware(getSignedUrl);

/**
 * sls logs -f getSignedUrl
 * sls deploy function --function getSignedUrl
 */
