"use strict";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { AuthenticationType } from "../../types/authtentication.table";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

type CalculateTotalType = {
  email: string;
  total: { total: number };
};

const deductPoints = async (email: string) => {
  const command = new UpdateCommand({
    TableName: process.env.AUTHENTICATION_TABLE_NAME,
    ExpressionAttributeNames: {
      "#POINTS": "RedeemPoints",
    },
    ExpressionAttributeValues: {
      ":zero": 0,
    },
    Key: {
      Email: email,
    },
    UpdateExpression: "SET #POINTS = :zero",
    // item we have just updated
    ReturnValues: "ALL_NEW",
  });
  await ddbDocClient.send(command);
};

const redeemPoints = async ({ email, total }: CalculateTotalType) => {
  let response;
  let orderTotal = total.total;
  try {
    const command = new GetCommand({
      TableName: process.env.AUTHENTICATION_TABLE_NAME,
      Key: {
        Email: email,
      },
    });
    response = await ddbDocClient.send(command);
    let user = response.Item as AuthenticationType;

    const userPoints = user.RedeemPoints;
    if (orderTotal > userPoints) {
      await deductPoints(email);
      orderTotal = orderTotal - userPoints;
      // this output object we can pass it along all the steps
      return {
        total: orderTotal,
        // returning this so i can access it in the object itself
        points: userPoints,
      };
    } else {
      throw new Error("Order total is less than redeem points");
    }
  } catch (err) {
    // i am not gonna add any error name etc here because i will add general error handling error
    // by using ErrorEquals: [States.ALL] so it will match with all the error
    throw new Error(err);
  }
  return {
    total,
  };
};

export const handler = redeemPoints;

/**
 * serverless logs -f redeemPoints
 * serverless deploy function --function redeemPoints
 */
