import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AuctionType } from "../../types/auction.table";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

type RestoreQuantityType = {
  auction: AuctionType;
  quantity: number;
};

const restoreQuantity = async ({ auction, quantity }: RestoreQuantityType) => {
  const auctionId = auction.Id;
  console.log("bookId: ", auctionId);
  console.log("orderQuantity: ", quantity);
  const command = new UpdateCommand({
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    Key: { Id: auctionId },
    UpdateExpression: "SET Quantity = Quantity + :orderQuantity",
    ExpressionAttributeValues: {
      ":orderQuantity": quantity,
    },
  });
  try {
    await ddbDocClient.send(command);
    return "Quantity Restored";
  } catch (err) {
    throw new Error(err);
  }
};

export const handler = restoreQuantity;
