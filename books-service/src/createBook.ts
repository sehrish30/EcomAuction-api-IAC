import { AppSyncResolverHandler } from "aws-lambda";
import { MutationCreateBookArgs, Book } from "../appsync";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandOutput,
  GetCommand,
  GetCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: AppSyncResolverHandler<
  MutationCreateBookArgs,
  Book
> = async (event) => {
  console.log(event.arguments.newBook);
  const { newBook } = event.arguments;
  const uniqueKey = uuid();
  const data = {
    bookId: uniqueKey,
    title: newBook?.title,
    description: newBook?.description,
    imageUrl: newBook?.imageUrl,
    author: newBook?.author,
    price: newBook?.price,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const book = {
    TableName: process.env.BOOKES_TABLE as string,
    Item: data,
    // check if there is already note with this id to check idempotency
    ConditionExpression: "attribute_not_exists(BookId)",
  };
  const command = new PutCommand(book);

  // use Query to get nextToken
  const getBookCommand = new GetCommand({
    TableName: process.env.BOOKES_TABLE as string,
    Key: {
      bookId: uniqueKey,
    },
  });
  try {
    const response2 = await ddbDocClient.send(command);
    console.log({ response2 });
    const response = await ddbDocClient.send(getBookCommand);

    console.log({ response });
    return response.Item as Book;
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * serverless logs -f createBook
 * serverless deploy function --function createBook
 */

// graphql-codegen
