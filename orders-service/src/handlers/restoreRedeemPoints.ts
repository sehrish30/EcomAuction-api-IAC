"use strict";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.REGION,
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

type RestoreRedeemPointsType = {
  total: { points: number };
  email: string;
};

const restoreRedeemPoints = async ({
  email,
  total,
}: RestoreRedeemPointsType) => {
  // bill the customer call stripe
  // from frontend u can pass along stripe token
  // and inject it into state machine
  console.log({
    email,
    total,
  });
  // only restore if points were updated in the previouds steps
  if (total.points) {
    const command = new UpdateCommand({
      TableName: process.env.AUTHENTICATION_TABLE_NAME,
      ExpressionAttributeNames: {
        "#POINTS": "RedeemPoints",
      },
      ExpressionAttributeValues: {
        ":points": total.points,
      },
      Key: {
        Email: email,
      },
      UpdateExpression: "SET #POINTS = :points",
      // item we have just updated
      ReturnValues: "ALL_NEW",
    });
    await ddbDocClient.send(command);
  }
  return "restoreRedeemPoints";
};

export const handler = restoreRedeemPoints;

/**
 * serverless logs -f calculateTotal
 * serverless deploy function --function calculateTotal
 */
