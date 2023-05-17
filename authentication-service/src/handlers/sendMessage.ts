import { APIGatewayProxyWebsocketEventV2, Context } from "aws-lambda";
import createError from "http-errors";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const sendSocketToClient = async (
  event: APIGatewayProxyWebsocketEventV2,
  context: Context
) => {
  console.log("HIT ME", event.requestContext.connectionId, event);
  let body = JSON.parse(event.body as string);
  console.log({ body });

  try {
    const input = {
      ExpressionAttributeValues: {
        ":ConnectionId": event.requestContext.connectionId,
      },
      ExpressionAttributeNames: {
        "#ConnectionId": "ConnectionId",
      },
      KeyConditionExpression: "#ConnectionId = :ConnectionId",
      TableName: process.env.CONNECTIONS_WEBSOCKET_TABLE,
    };
    const command = new QueryCommand(input);
    const response = await ddbDocClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.log(err);
    throw new createError.InternalServerError("Internal server error");
  }
};

export const handler = sendSocketToClient;
// serverless logs -f sendMessage

/**
 * serverless logs -f sendSocketToClient
 * serverless deploy function --function sendSocketToClient
 */
