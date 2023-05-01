import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import {Auction} from "../types"

const client = new DynamoDBClient({
  region: "us-east-2",
  apiVersion: "2012-08-10",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const sqsClient = new SQSClient({ region: "us-east-2" });



export async function closeAuction(auction: Record<string, Auction>) {
  const input = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {
      Id: auction.Id,
    },
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#ST": "Status",
    },
    UpdateExpression: "SET #ST = :status",
    ReturnValues: "ALL_NEW",
  };
  const command = new UpdateCommand(input);

  await ddbDocClient.send(command);

  const { Title, Seller, HighestBidAmount, HighestBidBidder } = auction;

  // No bids cases send message to seller
  if (+HighestBidAmount === 0) {
    const notifySellerCommand = new SendMessageCommand({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      // this is body of our message
      // also what sns expects to get otherwise it wont know what to do with ur message
      MessageBody: JSON.stringify({
        subject: "No bids on your auction item :)",
        recipient: HighestBidAmount,
        body: `Oh no! Your item ${Title} didnot get any bids. Better luck next time`,
      }),
    });

    // await sqsClient.send(notifySellerCommand);
    // return;
    // will return [ Promise { undefined } ]

    // both approaches are same following is better
    const notifySellerSend = sqsClient.send(notifySellerCommand);
    return Promise.all([notifySellerSend]); // will return this [Promise {Object}, Promise {Object}]
    // final return [ Promise { [ [Object] ] } ]
  }
  // generate promises
  // one for notifying seller
  // and one for notifying bidder
  // and then run promsie so i can send both email or sqs messages
  // in parallel
  const notifySellerCommand = new SendMessageCommand({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    // this is body of our message
    // also what sns expects to get otherwise it wont know what to do with ur message
    MessageBody: JSON.stringify({
      subject: "Your item has been sold",
      recipient: Seller,
      body: `Wohoo! your item ${Title} has been sold for ${HighestBidAmount}`,
    }),
  });

  const notifyBidderCommand = new SendMessageCommand({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    // this is body of our message
    // also what sns expects to get otherwise it wont know what to do with ur message
    MessageBody: JSON.stringify({
      subject: "You won an auction",
      recipient: HighestBidBidder,
      body: `What a great deal! You got yourself a ${Title} for ${HighestBidAmount}`,
    }),
  });
  const notifySellerSend = sqsClient.send(notifySellerCommand);
  const notifyBidderSend = sqsClient.send(notifyBidderCommand);
  return Promise.all([notifySellerSend, notifyBidderSend]);
}
