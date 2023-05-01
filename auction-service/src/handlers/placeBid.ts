import createError from "http-errors";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, Context } from "aws-lambda";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import {
    DynamoDBDocumentClient,
    UpdateCommand
  } from "@aws-sdk/lib-dynamodb";

import placeBidSchema from "../lib/schemas/placeBidSchema";
import { getAuctionById } from "./getAuction";
import commonMiddleware from "../lib/commonMiddleware";

const client = new DynamoDBClient({
  region: "us-east-2",
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

async function placeBid(event: APIGatewayEvent, ctx: Context) {
  const { id } = event.pathParameters as { id: string };
  const { amount } = event.body as unknown as {amount: number};
  const { email } = event.requestContext.authorizer as { email: string };

  // validate placing a bid
  const auction = await getAuctionById(id);
  // Bid identitly validation
  if (email === auction?.seller) {
    throw new createError.Forbidden(`You cannot bid your own auctions`);
  }

  // avoid double bidding
  if (email === auction?.highestBidBidder) {
    throw new createError.Forbidden(`You are already the highest bidder`);
  }

  // Auction Status validation
  if (auction.status !== "OPEN") {
    throw new createError.Forbidden("You cannot bid on closed auctions");
  }

  // Bid amount validation
  if (auction?.highestBidAmount && amount <= +auction?.highestBidAmount) {
    throw new createError.Forbidden(
      `You bid must be higher than ${auction.highestBidAmount}`
    );
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    ExpressionAttributeNames: {
      "#GAM": "highestBidAmount",
      "#HBB": "highestBidBidder",
    },
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email,
    },
    Key: {
      id,
    },
    UpdateExpression: "SET #GAM = :amount, #HBB = :bidder",
    // item we have just updated
    ReturnValues: "ALL_NEW",
  };
  let response;
  try {
    const command = new UpdateCommand(params);
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError(err);
  }
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
}

export const handler = commonMiddleware(placeBid).use(
  validator({
    eventSchema: transpileSchema(placeBidSchema),
  })
);

// serverless deploy function --function placeBid
// serverless logs -f placeBid --startTime 1h

/**
 * {
  "nickname": "sehrishwaheed98",
  "name": "sehrishwaheed98@gmail.com",
  "picture": "https://s.gravatar.com/avatar/f2ec43d44b79520fb880f0b00b1f62b9?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fse.png",
  "updated_at": "2023-03-24T21:29:32.633Z",
  "email": "sehrishwaheed98@gmail.com",
  "email_verified": false,
  "iss": "https://dev-mtzrfmcr246svjn6.us.auth0.com/",
  "aud": "ky4C6XXzXQhXHNnnPh9iDJqo6QW59zPV",
  "iat": 1679693372,
  "exp": 1679729372,
  "sub": "auth0|641e11cff939365a568f0faf"
}
 */
