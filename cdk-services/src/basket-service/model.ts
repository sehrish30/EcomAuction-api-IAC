import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { APIGatewayEvent } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
// import { unMarshalItem } from "./lib/util";
import createError from "http-errors";
import { ebClient } from "./eventBridgeClient";

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

    return deletedProduct;
  } catch (error) {
    const err = error as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

interface ICheckoutBasket {
  userName: string;
}

interface IBasketItem {
  quantity: number;
  color: string;
  price: number;
  productId: string;
  productName: string;
}

const prepareOrderPayload = (
  checkoutBasket: ICheckoutBasket,
  basket: Record<string, any>
) => {
  const newBasket = {
    ...checkoutBasket,
    totalPrice: 0,
  };

  try {
    if (basket === null || basket.items?.length === 0) {
      throw createError.BadRequest("Basket has no items");
    }

    let totalPrice = 0;
    basket.items.forEach(
      (item: IBasketItem) => (totalPrice = totalPrice + item.price)
    );
    newBasket.totalPrice = +totalPrice.toFixed(2);

    // copy all objects from basket to newBasket
    Object.assign(newBasket, basket);

    return newBasket;
  } catch (e) {
    const err = e as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};

const publishCheckoutBasketEvent = async (checkoutPayload: ICheckoutBasket) => {
  const input = {
    Entries: [
      {
        Source: process.env.EVENT_SOURCE,
        Resources: [],
        DetailType: process.env.EVENT_DETAIL_TYPE,
        Detail: JSON.stringify(checkoutPayload),
        EventBusName: process.env.EVENT_BUSNAME,
      },
    ],
  };

  return await ebClient.send(new PutEventsCommand(input));
};

// asynchronous communication
export const checkoutBasket = async (event: APIGatewayEvent) => {
  // payload: {userName, firstName, lastName, email}
  const checkoutBasket = JSON.parse(event.body as string) as ICheckoutBasket;

  if (checkoutBasket === null || !checkoutBasket?.userName) {
    throw createError.BadRequest("Username is required");
  }

  try {
    // get existing basket objects with items
    const basket = await getBasket(checkoutBasket.userName);

    // create an event json object with basket items and calculated totalPrice
    // prepare order create json data to send ordering microservice
    const checkoutPayload = prepareOrderPayload(checkoutBasket, basket);

    // publish an event to the event bridge, this will subscribe by order microservice
    const publishEvent = await publishCheckoutBasketEvent(checkoutPayload);

    // remove existing basket
    await deleteBasket(checkoutBasket.userName);

    return publishEvent;
  } catch (e) {
    const err = e as Error;
    console.log(err);
    throw createError.InternalServerError(err?.message as string);
  }
};
