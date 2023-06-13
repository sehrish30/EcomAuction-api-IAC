import { AppSyncResolverHandler } from "aws-lambda";
import { QueryListBooksArgs, BooksPage, Book } from "../appsync";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: AppSyncResolverHandler<
  QueryListBooksArgs,
  BooksPage
> = async (event) => {
  console.log({ arguments: event.arguments });

  let input: QueryCommandInput = {
    ExpressionAttributeValues: {
      ":price": 1.5,
    },
    ExpressionAttributeNames: {
      "#price": "price",
    },
    KeyConditionExpression: "#price = :price",
    TableName: process.env.BOOKES_TABLE as string,
    IndexName: "ByPriceAndCreatedAtIndex",
    Limit: event.arguments.limit,
  };

  if (event.arguments.nextBookId) {
    input.ExclusiveStartKey = {
      bookId: event.arguments?.nextBookId,
      price: Number(event.arguments?.nextPrice),
      createdAt: event.arguments?.nextCreatedAt,
    };
  }
  const command = new QueryCommand(input);
  let response = await ddbDocClient.send(command);

  return {
    books: response.Items as Book[],
    nextToken: {
      ...(response.LastEvaluatedKey || {}),
    },
  };
};

// price: 1.5,
// bookId: '93945b3d-55f1-4355-8a8f-0a92a842c0f6',
// createdAt: '2023-05-24T13:43:31.061Z'
/**
 * serverless logs -f listBooks
 * serverless deploy function --function listBooks
 */

/**
 * Graphql subscription, allows graphql server (e.g appsync service) to
 *  send data through Websocket/MQTT to its clients when a specific event occurs
 *
 * Create a subscription onCreateBook mutation, so all connected bookstore live users
 * who are using web or mobile app will receive a real time notification
 * when a store admin adds a new book to the online store
 */
