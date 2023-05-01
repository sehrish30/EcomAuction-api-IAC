"use strict";

import { APIGatewayEvent, Context } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import createError from "http-errors";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import commonMiddleware from "../lib/commonMiddleware";
import createAuctionSchema from "../lib/schemas/createAuctionsSchema";

const client = new DynamoDBClient({
  region: "us-east-2",
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const createAuction = async (event: APIGatewayEvent, ctx: Context) => {
  // body is automaticall parsed by middy middleware
  const { title } = event.body as unknown as { title: string };

  const now = new Date();
  const endDate = new Date();

  // close auction after 24 hour
  endDate.setHours(now.getHours() + 24);

  const auction = {
    Item: {
      Id: uuid(),
      Title: title,
      Status: "OPEN",
      CreatedAt: now.toISOString(),
      HighestBidAmount: 0,
      EndingAt: endDate.toISOString(),
    },
    TableName: process.env.AUCTIONS_TABLE_NAME,
  };

  console.log({ auction });

  const command = new PutCommand(auction);
  let response;
  try {
    response = await ddbDocClient.send(command);
  } catch (err) {
    throw new createError.InternalServerError(err);
  }
  return {
    statusCode: 201,
    body: JSON.stringify(response),
  };
};

export const handler = commonMiddleware(createAuction).use(
  validator({
    eventSchema: transpileSchema(createAuctionSchema),
  })
);

/**
 * serverless logs -f createAuction
 * serverless deploy function --function createAuction
 */
