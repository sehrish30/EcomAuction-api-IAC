import stream, { Readable, Writable } from "stream";
import util from "util";
import { Context, APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const pipeline = util.promisify(stream.pipeline);

const s3Client = new S3Client({
  region: process.env.REGION,
});

/**
 * streams to process smaller chunks of data, makes it possible to read larger files
 * Streams 1) time 2)Memory efficiency
 * awslambda is runtime variable
 * awslambda.streamifyResponse = enables the function to stream responses.
 * https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html
 * request and response event payloads follow the same format as API Gateway's HTTP API
 * https://www.serverless.com/blog/aws-lambda-function-urls-with-serverless-framework
 * https://www.serverless.com/plugins/serverless-aws-function-url-custom-domain
 * https://ofx5qxfkwmtkq2ebsvp2wd35zu0hnxlf.lambda-url.us-east-2.on.aws/?fileName=sample.pdf
 * APIGatewayProxyEvent includes(httpMethod, path, headers, queryStringParameters and multiValueQueryStringParameters that provide access to the request parameters and headers)
 * APIGatewayEvent includes(pathParameters, requestContext, body)
 */

const orderReceiptPDF = async (
  event: APIGatewayProxyEvent,
  responseStream: Writable,
  _context: Context
) => {
  let fileName = event.queryStringParameters?.fileName;

  let notFoundFileName = false;
  if (!fileName) {
    notFoundFileName = true;
    // here u can show error or show image message that elegantly says pdf not found and tells user about the query parameter funciton needs
    // depends on ur business requirement
    fileName = "404.jpeg";
  }

  console.log({bucketName: process.env.AUCTIONS_BUCKET_NAME, region: process.env.REGION});

  const s3Command = {
    Bucket: process.env.AUCTIONS_BUCKET_NAME,
    Key: fileName,
  };
  console.log("Creating a S3 ReadStream");
  const command = new GetObjectCommand(s3Command);
  const s3Item = await s3Client.send(command);
  const s3ItemBody = s3Item.Body as Iterable<any> | AsyncIterable<any>;

  // stream from which data can be read
  const requestStream = Readable.from(s3ItemBody);

  const metadata = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/pdf",
    },
  };

  const metadata404 = {
    statusCode: 200,
    headers: {
      "Content-Type": "image/jpeg",
    },
  };

  const metaDataToSend = notFoundFileName ? metadata404 : metadata;
  console.log("Streaming PDF file via function URL $HOOK1", notFoundFileName);
  // @ts-ignore
  responseStream = awslambda.HttpResponseStream.from(
    responseStream,
    metaDataToSend
  );

  // pipe this request stream data to the client
  // you can also directly write to response stream but this is more performant
  await pipeline(requestStream, responseStream);
};

// @ts-ignore
export const handler = awslambda.streamifyResponse(orderReceiptPDF);

/**
 * serverless deploy function --function orderReceiptPDF
 * serverless logs -f orderReceiptPDF
 */
