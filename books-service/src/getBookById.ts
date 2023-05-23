import { AppSyncResolverHandler } from "aws-lambda";
import { Book, MutationCreateBookArgs } from "../appsync";

export const handler: AppSyncResolverHandler<MutationCreateBookArgs, Book> = (
  event
) => {
  console.log(event.arguments);
};

/**
 * serverless logs -f getBookById
 * serverless deploy function --function getBookById
 */
