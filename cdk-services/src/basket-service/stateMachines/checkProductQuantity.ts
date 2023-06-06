import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "../ddbClient";
import { IProduct } from "../types";

const deletProduct = async (data: IProduct) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({
        id: data.id,
      }),
      // delete only if item is present in dynamo db else throw err, idempotency
      ConditionExpression: "attribute_exists(id)",
    };
    const command = new DeleteItemCommand(params);
    const response = await ddbClient.send(command);
    console.log({ response });
    return response;
  } catch (err) {
    throw err;
  }
};

export const handler = async (data: IProduct) => {
  console.log("CHECK PRODUCT QUANTITY", data, process.env.DYNAMODB_TABLE_NAME);

  try {
    if (data?.quantity === 0) {
      return await deletProduct(data);
    } else {
      return data;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};
