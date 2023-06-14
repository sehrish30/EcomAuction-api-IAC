import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import logging from "/opt/nodejs/logging";

import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProduct,
  getProductsByCategory,
  updateProduct,
} from "./model";

/**
 * As we are using pay as u go model
 * execution model will decrease if we have already loaded the database connections
 * before executing lambda function
 */
export async function handler(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  console.log(
    "logging 👉",
    logging(),
    event.httpMethod,
    event?.requestContext?.authorizer
  );

  /**
   * Check event http method
   */

  let body;

  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.queryStringParameters !== null) {
          body = await getProductsByCategory(event); // GET product/1234?category=Phone
        } else {
          if (event.pathParameters !== null) {
            body = await getProduct(event.pathParameters?.id); // GET /product/{id}
          } else {
            body = await getAllProducts(
              event?.requestContext?.authorizer?.email
            ); // get /product
          }
        }
        break;
      case "POST":
        body = await createProduct(event); // post /product
        break;
      case "DELETE":
        body = await deleteProduct(event.pathParameters?.id as string); // DELETE /product/{id}
        break;
      case "PUT":
        body = await updateProduct(event); // PUT /product/{id}
        break;
      default:
        throw new Error(`Unsupported route: ${event.httpMethod}`);
    }
    console.log({ body });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation ${event.httpMethod}`,
        body,
      }),
    };
  } catch (e) {
    const err = e as Error;
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation",
        errMsg: err.message,
        errorStack: err.stack,
      }),
    };
  }
}
