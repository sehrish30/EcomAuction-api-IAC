import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import createError from "http-errors";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const listenToQueue = async (event: SQSEvent) => {
  const data = JSON.parse(event.Records[0].body);

  console.log({ data, tableName: process.env.AUTHENTICATION_TABLE_NAME });
  // call external api get rating

  const RATING = 5;

  const params = {
    TableName: process.env.AUTHENTICATION_TABLE_NAME,
    ExpressionAttributeNames: {
      "#Rating": "Rating",
    },
    ExpressionAttributeValues: {
      ":rating": RATING,
    },
    Key: {
      Email: `${data.userEmail}`,
    },
    UpdateExpression: "SET #Rating = :rating",
    // item we have just updated
    ReturnValues: "ALL_NEW",
  };
  let response;
  try {
    // save in dynamo db
    const command = new UpdateCommand(params);
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.log(err);
    // as soon as error is sent it will be sent back to sqs queue
    throw new createError.InternalServerError("Internal server error");
  }
  console.log("SEND RESPONSE", data.ConnectionId);
  return {
    statusCode: 200,
    body: JSON.stringify({
      rating: RATING,
      ConnectionId: data.ConnectionId,
      response,
    }),
  };
};

export const handler = listenToQueue;

/**
 * serverless logs -f listenToQueue
 * serverless deploy function --function listenToQueue
 */
