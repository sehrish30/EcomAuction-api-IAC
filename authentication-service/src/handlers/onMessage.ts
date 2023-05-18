import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

const sendSocketToClient = async (event: APIGatewayProxyWebsocketEventV2) => {
  return {
    statusCode: 200,
    body: JSON.stringify(event.requestContext.connectionId),
  };
};

export const handler = sendSocketToClient;

/**
 * serverless logs -f sendSocketToClient
 * serverless deploy function --function sendSocketToClient
 */
