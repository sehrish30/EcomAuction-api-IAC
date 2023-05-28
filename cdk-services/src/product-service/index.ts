import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
} from "./model";

/**
 * As we are using pay as u go model
 * execution model will decrease if we have already loaded the database connections
 * before executing lambda function
 */
export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  console.log("event 👉", event);

  /**
   * Check event http method
   */

  let body;

  switch (event.httpMethod) {
    case "GET":
      if (event.pathParameters !== null) {
        body = await getProduct(event.pathParameters?.id); // /product/{id}
      } else {
        body = await getAllProducts();
      }
      break;
    case "POST":
      body = await createProduct(event);
      break;
    case "DELETE":
      body = await deleteProduct(event.pathParameters?.id as string);
      break;
    default:
      throw new Error(`Unsupported route: ${event.httpMethod}`);
  }

  return {
    body: JSON.stringify(body),
    statusCode: 200,
  };
}
