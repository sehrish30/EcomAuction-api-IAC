"use strict";

// import { StepFunctionsEvent } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { AuctionType } from "../../types/auction.table";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const isAuctionItemAvailable = (auction: AuctionType, quantity: number) => {
  return auction.Quantity! - quantity;
};

type CheckInventoryType = {
  auctionId: string;
  quantity: number;
};

const checkInventory = async ({ auctionId, quantity }: CheckInventoryType) => {
  try {
    console.log({
      auctionId,
      quantity,
      auctionsTable: process.env.AUCTIONS_TABLE_NAME,
    });
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

/**
 * Task State: on eunit of work
 * After this will evaluate Next State to transitiion to different page
 * also retry
 *
 * Wait State: to wait for few seconds
 *
 * Parallel state: 2 things in paraller
 * but with same input
 * if one of the things fail entire state fail
 *
 * Choice state: contains if else statements
 * else is like default statement
 *
 * Pass state:
 * Append new objects to your execution state
 * if we dont specify anything except $ in ResultPath
 * it will replace entire input object will be replaced
 * by whatever the result attrbibutes that we add here
 *
 * Succeed state: successfult complete the state machine
 *
 * Fail State: Fail the state machine
 *
 * Map state: map state different from parallel state because parallel
 * state is on single input
 * here we can have array of inputs
 * map state is also in parallel which considers ItemPath as an array
 * and it will iterate an array in ItemPath
 * parallel with maxConcurrency parameter
 * if maxConcurrency = 0 it will happen in sequence one after other
 *
 * Callback pattern:
 * Stop task and wait for callback
 * Example: Put the message in sqs and wait
 * until that message is consumed by a lambda or any other sevice
 * and once exexcution is completed then only we move to next step
 * step function will send task token along with that message
 * for example lambda function executed it will send task token
 * to state mahine to send a message back to the state machine  wether it is successful or not
 * so depending upon that message we can either move to success state or failure state
 * highly scalable approach in event driven architectures
 *
 * Activity: unit of work that needs to be performed by a worker
 * Once an activity is assigned to a worker, the worker is responsible for completing the task and reporting the results back to the state machine
 * Activities in AWS Step Functions are used to decouple workflow execution from the underlying work being performed
 * For example, an activity could be to process a message from a queue, execute a Lambda function, or run a custom script.
 * Once an activity is assigned to a worker, the worker is responsible for completing the task and reporting the results back to the state machine
 * To do this, the worker needs to provide a token to the state machine along with other message when it accepts the activity
 * token is a unique identifier that is used by the state machine to track the progress of the activity.
 * If the worker fails to complete the activity within a specified timeout period, the state machine will assume that the activity has failed and will move on to the next step in the workflow
 */

/**
 *{
  "auctionId": "2997905a-e700-4797-88ac-d2208171ee98",
  "quantity": 4,
  "email": "sehrishwaheed98@gmail.com",
  "redeem": false,
  "token": "pm_1N61a2AdvemoYxG9lqwb6zEn"
}
 */
