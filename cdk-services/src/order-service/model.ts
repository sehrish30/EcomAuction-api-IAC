import { ScanCommandInput } from "./node_modules/@aws-sdk/client-dynamodb/dist-types/commands/ScanCommand.d";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { TDetail } from "./types";
import createError from "http-errors";
import { ddbClient } from "./ddbClient";
import { APIGatewayEvent, AttributeValue, SQSEvent } from "aws-lambda";

export const createOrder = async (basketCheckoutEventDetail: TDetail) => {
  try {
    const orderDate = new Date().toISOString();
    basketCheckoutEventDetail.orderDate = orderDate;

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(basketCheckoutEventDetail || {}),
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));

    return createResult;
  } catch (e) {
    const err = e as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const getOrder = async (event: APIGatewayEvent) => {
  // expecting request: xxx/order/swn?orderDate=timestamp
  try {
    const userName = event?.pathParameters?.userName;
    const orderDate = event?.queryStringParameters?.orderDate;

    const params = {
      KeyConditionExpression: "userName = :userName and orderDate = :orderDate",
      ExpressionAttributeValues: marshall({
        ":userName": userName,
        ":orderDate": orderDate,
      }),
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new QueryCommand(params));

    return Items?.map((item) => unmarshall(item)) || [];
  } catch (e) {
    const err = e as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const getAllOrders = async (event: APIGatewayEvent) => {
  const LIMIT = 10;
  const LastEvaluatedUserName = event?.queryStringParameters
    ?.LastEvaluatedUserName as
    | ScanCommandInput["ExclusiveStartKey"]
    | undefined;

  const LastEvaluatedOrderDate = event?.queryStringParameters
    ?.LastEvaluatedOrderDate as
    | ScanCommandInput["ExclusiveStartKey"]
    | undefined;

  try {
    let params: ScanCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Limit: LIMIT,
    };
    if (LastEvaluatedUserName) {
      params.ExclusiveStartKey = marshall({
        userName: LastEvaluatedUserName,
        orderDate: LastEvaluatedOrderDate,
      });
    }
    const { Items, LastEvaluatedKey } = await ddbClient.send(
      new ScanCommand(params)
    );

    return {
      items: Items ? Items.map((item) => unmarshall(item)) : {},
      LastEvaluatedKey: LastEvaluatedKey ? unmarshall(LastEvaluatedKey) : null, //  "LastEvaluatedKey": null if no more content
    };
  } catch (e) {
    const err = e as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

export const sqsInvocation = async (event: SQSEvent) => {
  // Records only 1 because batchSize has been set 1 by me
  event.Records.forEach(async (record) => {
    console.log({ record });
    // expected record.body : { "detail-type\":\"CheckoutBasket\",\"source\":\"com.swn.basket.checkoutbasket\", "detail\":{\"userName\":\"swn\",\"totalPrice\":1820, .. }
    const checkoutEventRequest = JSON.parse(record.body);

    // create order item into db
    return await createOrder(checkoutEventRequest.detail);
    // detail object should be checkoutbasket json object
  });
};
