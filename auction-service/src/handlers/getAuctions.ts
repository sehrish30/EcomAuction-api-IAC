import createError from "http-errors";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import { APIGatewayEvent, Context } from "aws-lambda";
import getAuctionsSchema from "../lib/schemas/getAuctionsSchema";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import commonMiddleware from "../lib/commonMiddleware";


import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2",
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

async function getAuctions(event: APIGatewayEvent, context: Context) {
  let auctions;
  const { status } = event.queryStringParameters as unknown as {
    status: string;
  };

  /**
   * Auctions service to process auctions lambda function
   * send message to this message queue
   * so then these messages will be picked up by the notification service
   * and email will be sent
   * and for this we will use url of the message queue
   * to be available for auctions service
   *
   * U can also use pesudo paramaters and variables more flexible or hardcode
   *
   * cool feature of cloudfomation called outputs
   * using outputs u can output variables from one stack and then
   * import them in another stack
   * u can think of them as variables
   * so we will export arn and url of the message queue
   * so the auctions service can use it
   * sqs provides url which are used by clients to send messages to the queue
   * also gives us some bullet proof features
   * like you want to deploy auction service to production
   * and forgot to deploy notifications service
   * obv our service will not work properly because we wont be able to send emails
   * so by using these variables we create dependency
   *
   * where if we try to deploy auction service to production
   * and notification service isnot deployed we will get an error
   * which is good because notifications service is dependency for smooth operation of our service
   */
  try {
    const input = {
      ExpressionAttributeValues: {
        ":status": status,
      },
      ExpressionAttributeNames: {
        "#status": "Status",
      },
      KeyConditionExpression: "#status = :status",
      TableName: process.env.AUCTIONS_TABLE_NAME,
      IndexName: "StatusAndEndDate",
    };

    const command = new QueryCommand(input);
    const response = await ddbDocClient.send(command);
    auctions = response.Items;
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError("Internal server error");
  }
  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

// wrong status query threw => Event object failed validation
export const handler = commonMiddleware(getAuctions).use(
  validator({
    eventSchema: transpileSchema(getAuctionsSchema, {
      // @ts-ignore
      ajvOptions: {
        // if queryStringParameters were not defined
        // we will set default value as defined in the schema
        useDefaults: true,
        // user can provide or skip query parameters wont throw an error and useDefaults property will use default value from schema
        strict: false,
      },
    }),   
  })
);

/**
 *  serverless deploy function --function getAuctions
   serverless logs -f getAuctions --startTime 1h
 */
