import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    UpdateCommand,
  } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2",
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

export const setAuctionPictureUrl= async(id: string, pictureUrl: string) => {
  const input = {
    TableName: process.env.AUCTIONS_TABLE_NAME as string,
    Key: {
      Id: id,
    },
    ExpressionAttributeValues: {
      ":pictureUrl": pictureUrl,
    },
    UpdateExpression: "SET PictureUrl = :pictureUrl",
    ReturnValues: "ALL_NEW",
  };
  const command = new UpdateCommand(input);

  const result = await ddbDocClient.send(command);
  return result.Attributes;
}
