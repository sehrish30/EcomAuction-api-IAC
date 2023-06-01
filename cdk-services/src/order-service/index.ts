import { APIGatewayEvent, EventBridgeEvent } from "aws-lambda";

import { createOrder, getAllOrders, getOrder } from "./model";
import { TDetail, TDetailType } from "./types";

export const handler = async (
  event: EventBridgeEvent<TDetailType, TDetail> & APIGatewayEvent
) => {
  const eventType = event["detail-type"];
  if (eventType) {
    // EventBridge Invocation
    return await eventBridgeInvocation(event);
  } else {
    // API Gateway invocation -- return sync response
    return await apiGatewayInvocation(event);
  }
};

const eventBridgeInvocation = async (
  event: EventBridgeEvent<TDetailType, TDetail>
) => {
  await createOrder(event.detail);
};

const apiGatewayInvocation = async (event: APIGatewayEvent) => {
  let body;
  try {
    switch (event.httpMethod) {
      case "GET":
        if (event.pathParameters) {
          body = await getOrder(event);
        } else {
          body = await getAllOrders(event);
        }
        break;
      default:
        throw new Error(`Unsupported route ${event.httpMethod}`);
    }
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
        errorMsg: err.message,
        errorStack: err.stack,
      }),
    };
  }
};
