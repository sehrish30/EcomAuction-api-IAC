import { marshall } from "@aws-sdk/util-dynamodb";
import { IStepFunction } from "../types";
import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "../ddbClient";

export const handler = async (event: IStepFunction) => {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: event.body.userName }),
    };
    const deletedProduct = await ddbClient.send(new DeleteItemCommand(params));

    return deletedProduct;
  } catch (error) {
    let BasketServerError = new Error("Basket couldnot be deleted");
    BasketServerError.name = "BasketServer";
    throw BasketServerError;
  }
};
