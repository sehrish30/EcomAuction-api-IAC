import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent, Context } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";

const client = new DynamoDBClient({
  region: process.env.REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

async function loginOrRegister(event: APIGatewayEvent, context: Context) {
  const { email } = event.requestContext.authorizer as { email: string };

  const getcommand = new GetCommand({
    TableName: process.env.AUTHENTICATION_TABLE_NAME,
    Key: {
      Email: email,
    },
  });

  let emailExists = await ddbDocClient.send(getcommand);

  if (emailExists.Item) {
    return {
      statusCode: 200,
      body: JSON.stringify(emailExists),
    };
  } else {
    const params = {
      Item: {
        Email: email,
        RedeemPoints: 0,
      },
      TableName: process.env.AUTHENTICATION_TABLE_NAME,
    };

    const command = new PutCommand(params);

    let response = await ddbDocClient.send(command);
    return {
      statusCode: 201,
      body: JSON.stringify(response),
    };
  }
}
export const handler = commonMiddleware(loginOrRegister);

/**
 * serverless logs -f loginOrRegister
 * serverless deploy function --function loginOrRegister
 */
