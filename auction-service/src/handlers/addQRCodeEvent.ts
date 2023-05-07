import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

import { APIGatewayEvent } from "aws-lambda";

let eventBridgeClient = new EventBridgeClient({
  region:  process.env.REGION,
});

const EVENT_BUS_NAME = process.env.EventBusName;
const EVENT_BRIDGE_SOURCE = process.env.EVENT_BRIDGE_SOURCE;
const AUCTION_DETAIL_TYPE = process.env.AUCTION_DETAIL_TYPE;

const addQRCodeEvent = async (event:APIGatewayEvent) => {
  let body = JSON.parse(event.body as string);
  // put event to event bridge
  let data;
  try {
    // same attributes should be included
    // in service proxy integration as well
    // body will be automatically passed down to event bridge
    // but we have to specify what is the source that we are using the detail type
    // the event bus name
    const params = {
      Entries: [
        {
          Source: EVENT_BRIDGE_SOURCE,
          DetailType: AUCTION_DETAIL_TYPE,
          Detail: JSON.stringify({
            auctionId: body.auctionId,
          }),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    };
    const command = new PutEventsCommand(params);
    data = await eventBridgeClient.send(command);
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err.message),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};

export const handler = addQRCodeEvent;

/**
 * serverless logs -f addQRCodeEvent
 * serverless deploy function --function addQRCodeEvent
 */

// # lambda consumer to batch process these messages that are in the queue
// # batch processing SQS messages with AWS Lambda
// # reserved concurrency to lambda function
// # standard queue batch size is 10,000
// # lambda does long polling
// # wait before processing set attribute
// # set Maximum Batching window(how long to wait for messages)
// # Visibility timeout and lambda timeout

/**
 * Visibility timeout meeans 5 sec that means if one of the messages
 * are being taken by one of the workers
 * given to lambda by worker
 * sqswill wait up to 5 sec allowing lambda to finish the processing of that particular message
 * if lambda couldnot process within that five second time,
 * That message will reappear in the queue
 * then that message will be processed by another
 * lambda function
 * it is really imp that u configure this visibility timeout value properly
 * recommended visiblity timeout value should be 6x of lambda timeout
 * for lambda we can setup timeout upto 15 min but default is 6s
 * so maximum timeout for visiblity should be 6*6+batchvalueoflambdasbysqs
 * so 6*^+5 otherwiswe ur message will reappear in the sqs queue
 * while previous lambdas are procesing the message
 * and then processed by another lambda as well
 */

/**
 * HAndling partial failures
 * We process messages batch by batch in lambda function
 * failed messages should be sent back to sqs by default
 * so next lambda functions will fetch those messages and start processing it
 * thats y u should track the messages that are failed to process
 * and put those messages into this batch item failure object and send
 * those messages to sqs
 */
/**
 * Return Failure messages on:
 * Report batch item failures objects
 */
/**
 * Use dead letter queue
 * Define how many times message can come back to sqs queue
 * and depending upon a certain number lets say after the 2 time it got back to sqs queue
 * we are not gng to process them further, we will send them to dead letetr queue
 * to further investigate what has gone wrong with those messages
 * otherwise they will keep appearing and use lambda functions
 * and will never stop
 */

/**
 * Lambda function that will process messages in sqs in batches
 */
