import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  checkoutBasket,
  createBasket,
  deleteBasket,
  getAllBaskets,
  getBasket,
} from "./model";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    let body;
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters !== null) {
          body = await getBasket(event.pathParameters?.userName as string); // GET /basket/{userName}
        } else {
          body = await getAllBaskets(); // GET /basket
        }
        break;
      case "POST":
        if (event.path === "/basket/checkout") {
          body = await checkoutBasket(event); // POST /basket/checkout
        } else {
          body = await createBasket(event); // POST /basket
        }
        break;
      case "DELETE":
        body = await deleteBasket(event.pathParameters?.userName as string); // DELETE /basket/{userName}
        break;
      default:
        throw new Error("Cannot get basket");
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished ${event.httpMethod}`,
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
  return {
    statusCode: 200,
    body: JSON.stringify({
      body: "Hello from backet",
    }),
  };
};
