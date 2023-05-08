"use strict";

// import { StepFunctionsEvent } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { AuctionType } from "../../types/auction.table";



const client = new DynamoDBClient({
  region: process.env.REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const isAuctionItemAvailable = (auction: AuctionType, quantity: number) => {
  return auction.Quantity! - quantity;
};

type CheckInventoryType = {
    auctionId: string;
    quantity: number;
}

const checkInventory = async ({auctionId, quantity}: CheckInventoryType) => {
  try {
    console.log({auctionId, quantity, auctionsTable: process.env.AUCTIONS_TABLE_NAME})
    const input = {
      ExpressionAttributeValues: {
        ":auctionId": auctionId,
      },
      KeyConditionExpression: "Id = :auctionId",
      TableName: process.env.AUCTIONS_TABLE_NAME,
    };
    const command = new QueryCommand(input);
    const response = await ddbDocClient.send(command);
    let auction = response.Items?.[0] as AuctionType | undefined;

    if (auction && auction.Quantity) {
      if (isAuctionItemAvailable(auction, quantity)) {
        return auction;
      }
    } else {
      let auctionOutOfStockError = new Error("The auction is not available");
      auctionOutOfStockError.name = "AuctionOutOfStock";
      throw auctionOutOfStockError;
    }
  } catch (err) {
    if (err.name === "AuctionOutOfStock") {
      throw err;
    } else {
      let auctionNotFoundError = new Error(err);
      auctionNotFoundError.name = "AuctionNotFound";
      throw auctionNotFoundError;
    }
  }
};

export const handler = checkInventory;

/**
 * serverless logs -f checkInventory
 * serverless deploy function --function checkInventory
 */
