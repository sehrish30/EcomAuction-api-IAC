import createError from "http-errors";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "../ddbClient";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { IStepFunction } from "../types";

export const handler = async (event: IStepFunction) => {
  try {
    console.log("GETBASKET", event);
    const input = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: event.userName }),
    };

    const { Item } = await ddbClient.send(new GetItemCommand(input));

    return {
      basket: Item ? unmarshall(Item) : {}, // resultGetBasketOfUser
    };
  } catch (error) {
    throw error;
  }
};
