import { DynamoDB } from "./node_modules/@aws-sdk/client-dynamodb/dist-types/DynamoDB.d";
import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { APIGatewayEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
// import { unMarshalItem } from "./lib/util";
import createError from "http-errors";

export const getBasket = async (userName: string) => {
  try {
    const input = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName }),
    };

    const { Item } = await ddbClient.send(new GetItemCommand(input));

    return Item ? unmarshall(Item) : {};
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const getAllBaskets = async () => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const { Items } = await ddbClient.send(new ScanCommand(params));

    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const createBasket = async (event: APIGatewayEvent) => {
  const requestBody = JSON.parse(event.body as string);
  try {
    const productId = uuidv4();
    requestBody.id = productId;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(requestBody || {}),
    };
    const createResult = await ddbClient.send(new PutItemCommand(params));
    console.log({ createResult });

    return createResult;
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const deleteBasket = async (userName: string) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName }),
    };
    const deletedProduct = await ddbClient.send(new DeleteItemCommand(params));

    console.log(deletedProduct);

    return deletedProduct;
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const checkoutBasket = async (event: APIGatewayEvent) => {
  // asynchronous communication
};
