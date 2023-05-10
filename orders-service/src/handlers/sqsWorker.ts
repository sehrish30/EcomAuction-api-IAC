import {
  SFNClient,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";
import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const sfnsClient = new SFNClient({
  region: process.env.REGION,
});

const client = new DynamoDBClient({
  region: process.env.REGION,
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

// @aws-sdk/client-sfn step function sdk

const updateAuctionItemQuantity = async (
  auctionId: string,
  orderQuantity: number
) => {
  console.log("bookId: ", auctionId);
  console.log("orderQuantity: ", orderQuantity);
  const command = new UpdateCommand({
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    Key: { Id: auctionId },
    UpdateExpression: "SET Quantity = Quantity - :orderQuantity",
    ExpressionAttributeValues: {
      ":orderQuantity": orderQuantity,
    },
  });
  await ddbDocClient.send(command);
};
const sqsWorker = async (event: SQSEvent) => {
  // event is receiving the body
  console.log(JSON.stringify(event));
  let record = event.Records[0];

  const body = JSON.parse(record.body);
  try {
    /**
     * Once we find a courier then we are going to update the auction item quantity
     * we have to reduce auction item quantity from our inventory so far
     */
    /** Find a courier and attach courier information to the order from 3rd party API */
    let courier = "sehrishwaheed98@gmail.com";
    console.log(body.Input.auction.Id, body.Input.quantity);
    // update auction item quantity
    try {
      await updateAuctionItemQuantity(
        body.Input.auction.Id,
        body.Input.quantity
      );
    } catch (err) {
      throw new Error("Something wrong with Courier API");
    }

    // And once this is successful we need to send a task
    // success message to our step function
    // and this smessage will include task token
    // and we can retrive it from the body of the message

    /**
     * Sending the success message
     * I can add the output and this becomes the result
     * We always attach it to a new result path
     * and if there is an error
     * we are sending a task failure message
     * body.token is task token
     */

    // Attach curier information to the order
    const input = {
      // output becomes the result because of ResulltPath in yml file
      output: JSON.stringify({ courier }),
      // taskToken is must to step function
      taskToken: body.Token,
    };
    const command = new SendTaskSuccessCommand(input);
    await sfnsClient.send(command);
  } catch (e) {
    console.log("===== You got an Error =====");
    console.log(e);
    const command = new SendTaskFailureCommand({
      // this error name can be used in catch clause in serverless.yml
      error: "NoCourierAvailable",
      cause: "No couriers are available",
      taskToken: body.Token,
    });
    await sfnsClient.send(command);
  }
};

export const handler = sqsWorker;
