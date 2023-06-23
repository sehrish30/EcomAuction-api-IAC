import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { MutationTypingIndicatorArgs, TypingIndicator } from "../../../appsync";
import { uuid } from "../../utils";

const logger = new Logger({ serviceName: "TypingIndicatorLambda" });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

export const handler: AppSyncResolverHandler<
  MutationTypingIndicatorArgs,
  TypingIndicator
> = async (event) => {
  const documentClient = DynamoDBDocumentClient.from(client);

  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name here`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`typing input info", ${JSON.stringify(event.arguments)}`);
  const { userId, groupId, typing } = event.arguments;
  const params = {
    TableName: tableName,
    Item: {
      id: id,
      ENTITY: "TYPING",
      PK: `USER#${userId}`,
      SK: `GROUP#${groupId}#TYPING`,
      userId: userId,
      groupId: groupId,
      typing: typing,
      createdOn: createdOn,
    },
  };

  const command = new PutCommand(params);

  try {
    await documentClient.send(command);
    return { userId, groupId, typing };
  } catch (error: any) {
    logger.error(`an error occured while adding typing indicator ${error}`);
    throw new Error(`${error}`);
  }
};
