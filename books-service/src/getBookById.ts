import { AppSyncResolverHandler } from "aws-lambda";
import { QueryGetBookByIdArgs, Book } from "../appsync";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: AppSyncResolverHandler<
  QueryGetBookByIdArgs,
  Book
> = async (event) => {
  // event.arguments.bookId
  console.log(event.arguments);

  const getBookCommand = new GetCommand({
    TableName: process.env.BOOKES_TABLE as string,
    Key: {
      bookId: event.arguments.bookId,
    },
  });
  let bookCommand = await ddbDocClient.send(getBookCommand);
  console.log({ bookCommand });
  return bookCommand.Item as Book;
};

/**
 * serverless logs -f getBookById
 * serverless deploy function --function getBookById
 */
