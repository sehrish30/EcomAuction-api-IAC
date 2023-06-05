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

export async function getAuctionById(id:string) {
  let response;
  let auction;

  try {
    const command = new GetCommand({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: {
        Id: id,
      },
    });
    response = await ddbDocClient.send(command);
    auction = response.Item;
  } catch (err) {
    console.log(err);
    throw new createError.InternalServerError(err);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ${id} not found`);
  }
  return auction;
}

async function getAuction(event: APIGatewayEvent, context: Context) {
  const { id } = event.pathParameters as {id: string};
  const auction = await getAuctionById(id);
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(getAuction);

/**
 * serverless deploy function --function getAuction
 * serverless logs -f getAuction
 */
