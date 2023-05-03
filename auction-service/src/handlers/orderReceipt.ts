"use strict";
import stream, {Readable, Transform} from "stream"
import util from "util"
import { Context } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const pipeline = util.promisify(stream.pipeline);

const s3Client = new S3Client({
  region: "us-east-2",
});


// response streaming

async function orderReceipt = awslambda.streamifyResponse(async (event, responseStream, context:Context) => {
  const fileName = "abc.pdf"
  const s3Command = {
    Bucket: process.env.AUCTIONS_BUCKET_NAME,
    Key: fileName,
  };
  console.log("Creating a S3 ReadStream");
  const command = new GetObjectCommand(s3Command)
  const s3Item = await s3Client.send(command)
  const s3ItemBody = s3Item.Body as Iterable<any> | AsyncIterable<any>

  const requestStream = Readable.from(s3ItemBody);


  //  // Create a Readable stream using the S3 object data
  //  const readable = new Readable({
  //   read() {
  //     this.push(s3Item.Body);
  //     this.push(null);
  //   },
  // });

  //  // Create a Transform stream that converts each chunk of data to a string
  //  const transform = new Transform({
  //   transform(chunk, encoding, callback) {
  //     callback(null, chunk.toString());
  //   },
  // });

  const metadata = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/pdf",
    },
  };
  console.log("Streaming PDF file via function URL");
  responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

  // pipe this request stream data to the client
  // you can also directly write to response stream but this is more performant
  await pipeline(requestStream, responseStream);
});

export const handler = orderReceipt

/**
 * serverless deploy function --function orderReceipt
 * serverless logs -f orderReceipt
 */

