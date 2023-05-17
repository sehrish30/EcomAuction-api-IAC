import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const connectSocket = async (event: APIGatewayProxyWebsocketEventV2) => {
  console.log({
    event: event.requestContext.connectionId,
    tableName: process.env.CONNECTIONS_WEBSOCKET_TABLE,
  });
  if (!(event.requestContext && event.requestContext.connectionId)) {
    throw new Error("Invalid event. Missing `connectionId` parameter.");
  }
  const route = event.requestContext.routeKey;
  console.log(
    `Route ${route} - Socket connectionId connectedconected: ${
      event.requestContext && event.requestContext.connectionId
    }`
  );
  const putParams = {
    TableName: process.env.CONNECTIONS_WEBSOCKET_TABLE,
    Item: {
      ConnectionId: event.requestContext.connectionId,
    },
  };
  const command = new PutCommand(putParams);
  let response;
  try {
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      ConnectionId: event.requestContext.connectionId,
      response,
    }),
  };
};

export const handler = connectSocket;

/**
 * serverless logs -f connectSocket
 * serverless deploy function --function connectSocket
 */
