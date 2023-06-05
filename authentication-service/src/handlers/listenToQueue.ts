import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import createError from "http-errors";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});
const apigateWayClient = new ApiGatewayManagementApiClient({
  // region: process.env.AWS_REGION,
  endpoint: process.env.APIG_ENDPOINT,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const listenToQueue = async (event: SQSEvent) => {
  const data = JSON.parse(event.Records[0].body);

  // call external api get rating
  const RATING = 5;

  const params = {
    TableName: process.env.AUTHENTICATION_TABLE_NAME,
    ExpressionAttributeNames: {
      "#Rating": "Rating",
    },
    ExpressionAttributeValues: {
      ":rating": RATING,
    },
    Key: {
      Email: `${data.userEmail}`,
    },
    UpdateExpression: "SET #Rating = :rating",
    // item we have just updated
    ReturnValues: "ALL_NEW",
  };
  let response;
  let responseFromApiGateway;
  try {
    // save in dynamo db
    const command = new UpdateCommand(params);
    response = await ddbDocClient.send(command);

    const input = {
      Data: JSON.stringify(data), // required
      ConnectionId: data.ConnectionId, // required
    };

    // post message from server to client using connectionId
    // @ts-ignore
    const apiGatewayCommand = new PostToConnectionCommand(input);
    responseFromApiGateway = await apigateWayClient.send(apiGatewayCommand);
  } catch (err) {
    console.log(err);

    // as soon as error is sent it will be sent back to sqs queue
    throw new createError.InternalServerError("Internal server error");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ConnectionId: data.ConnectionId,
      responseFromApiGateway,
    }),
  };
};

export const handler = listenToQueue;

/**
 * serverless logs -f listenToQueue
 * serverless deploy function --function listenToQueue
 */
