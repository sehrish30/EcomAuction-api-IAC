"use strict";

import { APIGatewayEvent, Context } from "aws-lambda";
import { v4 as uuid } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import createError from "http-errors";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import commonMiddleware from "../lib/commonMiddleware";
import createAuctionSchema from "../lib/schemas/createAuctionsSchema";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const createAuction = async (event: APIGatewayEvent, ctx: Context) => {
  // body is automaticall parsed by middy middleware
  const { title, quantity } = event.body as unknown as {
    title: string;
    quantity: number;
  };
  const { email } = event.requestContext.authorizer as { email: string };

  const now = new Date();
  const endDate = new Date();

  if (quantity <= 0) {
    throw new createError.Forbidden("Auction item should have valid quantity");
  }

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
      Seller: email,
      PictureUrl: null,
      Points: 0,
      Quantity: quantity,
    },
    TableName: process.env.AUCTIONS_TABLE_NAME,
  };

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

/**
 * Lambda function: features

Runtime

handler

function

trigger

event

execution environment or execution context

Layer

Concurrency

Destination( from asynchronous invocation like, s3, sns )

environment reuse

database connection pooling

Resource-based policy

Environment variables
 */
