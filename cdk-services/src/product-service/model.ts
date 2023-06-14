import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
  QueryCommand,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";

import createError from "http-errors";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { APIGatewayEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { clearHashInRedis, saveDataInRedis, unMarshalItem } from "./lib/util";

export const getProduct = async (productId?: string) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: productId }),
    };
    const { Item } = await ddbClient.send(new GetItemCommand(params));
    return Item ? unmarshall(Item) : {};
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const getAllProducts = async (email: string) => {
  /**
   * Subsequent allows you to provide more granular
   * detail about a segment, including custom information
   */
  // https://sewb.dev/posts/cdk-series:-creating-an-elasticache-cluster-bc1zupe
  // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ClientVpnEndpoint.html
  console.log("GET ALL PRODUCTS");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const { Items } = await ddbClient.send(new ScanCommand(params));

    const data = Items ? Items.map((item) => unmarshall(item)) : {};

    console.log("REDIS", process.env.redisEndpoint, email);
    await saveDataInRedis(
      email || "",
      process.env.DYNAMODB_TABLE_NAME!,
      JSON.stringify(data)
    );
    console.log("AFTER SAVING DATA IN REDIS");
    return data;
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};
export const createProduct = async (event: APIGatewayEvent) => {
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
    await clearHashInRedis(event?.requestContext?.authorizer?.email);
    return createResult;
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: productId }),
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

export const updateProduct = async (event: APIGatewayEvent) => {
  try {
    const requestBody = JSON.parse(event.body as string);
    const objKeys = Object.keys(requestBody);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ id: event.pathParameters?.id }),
      UpdateExpression: `SET ${objKeys
        .map((_, index) => `#key${index} = :value${index}`)
        .join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce(
        (accumulator, currentKey, index) => ({
          ...accumulator,
          [`#key${index}`]: currentKey,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (accumulator, currentKey, index) => ({
            ...accumulator,
            [`:value${index}`]: requestBody[currentKey],
          }),
          {}
        )
      ),
      ReturnValues: "ALL_NEW",
    };

    const updatedProduct = await ddbClient.send(new UpdateItemCommand(params));

    console.log({ updatedProduct });
    const unmarshalledItem = unMarshalItem(updatedProduct);
    return {
      ...updatedProduct,
      Attributes: unmarshalledItem,
    } as UpdateItemCommandOutput;
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const getProductsByCategory = async (event: APIGatewayEvent) => {
  try {
    const productId = event.pathParameters?.id;
    const category = event.queryStringParameters?.category;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      ExpressionAttributeValues: marshall({
        ":productId": productId,
        ":category": category,
      }),
      KeyConditionExpression: "id = :productId",
      FilterExpression: "contains(category, :category)",
    };
    const { Items } = await ddbClient.send(new QueryCommand(params));

    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};
