import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayEvent } from "aws-lambda";

const client = new ApiGatewayManagementApiClient({
  region: process.env.AWS_REGION,
});

const sendSocketToClient = async (event: APIGatewayEvent) => {
  const body = JSON.parse(event.body as string);
  console.log({ body });
  const input = {
    // PostToConnectionRequest
    Data: JSON.stringify({
      rating: 10,
    }), // required
    ConnectionId: body.ConnectionId, // required
  };

  try {
    // @ts-ignore
    const command = new PostToConnectionCommand(input);
    const response = await client.send(command);
    return {
      statusCode: 200,
      response: JSON.stringify(response),
    };
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

export const handler = sendSocketToClient;

/**
 * serverless logs -f sendSocketToClient
 * serverless deploy function --function sendSocketToClient
 */
