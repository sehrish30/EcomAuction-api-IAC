import createError from "http-errors";
import { APIGatewayEvent, Context } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import commonMiddleware from "../lib/commonMiddleware";

import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2",
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

// response streaming

async function orderReceipt(event: APIGatewayEvent, context: Context) {
  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
}

export const handler = commonMiddleware(orderReceipt);

/**
 * serverless deploy function --function getAuction
 * serverless logs -f getAuction
 */
