import { Logger } from "@aws-lambda-powertools/logger";
import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { MutationAddUserToGroupArgs } from "../../../appsync";
import { uuid } from "../../utils";
const logger = new Logger({ serviceName: "AddUserToGroupLambda" });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

export const handler: AppSyncResolverHandler<
  MutationAddUserToGroupArgs,
  Boolean
> = async (event) => {
  const documentClient = DynamoDBDocumentClient.from(client);
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`group input info", ${JSON.stringify(event.arguments)}`);
  const { userId, groupId } = event.arguments;

  const params = {
    TableName: tableName,
    Item: {
      id: id,
      PK: `GROUP#${groupId}`,
      SK: `USER#${userId}`,
      GSI3PK: `USER#${userId}`,
      GSI3SK: `GROUP#${groupId}`,
      userId: userId,
      groupId: groupId,
      createdOn: createdOn,
    },
  };

  try {
    await documentClient.send(new PutCommand(params));
    return true;
  } catch (error: any) {
    logger.error(`an error occured while creating user ${error}`);
    return false;
  }
};
