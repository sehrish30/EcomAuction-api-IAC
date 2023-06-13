import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayEvent } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const addToUserRatingQueue = async (event: APIGatewayEvent) => {
  try {
    const data = event.body as unknown as { ConnectionId: string };

    const command = new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      // this is body of our message
      // also what sns expects to get otherwise it wont know what to do with ur message
      MessageBody: JSON.stringify(data),
    });

    const result = await sqsClient.send(command);
    console.log({ result });
    return {
      statusCode: 200,
      body: JSON.stringify({ result, ConnectionId: data?.ConnectionId }),
    };
  } catch (err) {
    throw new createError.InternalServerError(err);
  }
};
export const handler = commonMiddleware(addToUserRatingQueue);

/**
 * serverless logs -f addToUserRatingQueue
 * serverless deploy function --function addToUserRatingQueue
 */

// as soon as there is message available sqs triggers lambda
// this is called event source mapping
// or configure sqs to invoke one lambda for batch of messages
// visiblity timeout means as soon lambda is being processed by lambda its no more in the queue
// so any other lambda doesnot pick it up
// while it is already processed by previous lambda
//visibility tiemout must be greater than lambda timeout else
// message will appear in the queue
// before being processed by lambda
// avoid that for unexpected behavior
// message retention period (how long message stays in the queue if not consumed by lmabda or any other aws service)
// message receice count = how many times message should be retried before sending it to DLQ
