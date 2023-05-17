import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const disconnectHandler = async (event: APIGatewayProxyWebsocketEventV2) => {
  console.log({ event: event.body });
  if (!(event.requestContext && event.requestContext.connectionId)) {
    throw new Error("Invalid event. Missing `connectionId` parameter.");
  }
  const params = {
    TableName: process.env.CONNECTIONS_WEBSOCKET_TABLE,
    Key: {
      ConnectionId: event.requestContext.connectionId,
    },
    // delete only if item is present in dynamo db else throw err, idempotency
    ConditionExpression: "attribute_exists(ConnectionId)",
  };
  const command = new DeleteCommand(params);
  let response;
  try {
    response = await ddbDocClient.send(command);
  } catch (err) {
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

export const handler = disconnectHandler;
