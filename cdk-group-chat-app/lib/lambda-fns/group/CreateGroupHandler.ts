import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import { Group, MutationCreateGroupArgs } from "../../../appsync";
import { uuid } from "../../utils";
import GroupEntity from "./GroupEntity";

const logger = new Logger({ serviceName: "CreateGroupLambda" });

export const handler: AppSyncResolverHandler<
  MutationCreateGroupArgs,
  Group
> = async (event) => {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
  });

  const ddbDocClient = DynamoDBDocumentClient.from(client);
  let tableName = process.env.GroupChat_DB;
  const createdOn = Date.now();
  const id: string = uuid();
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  const groupInput: GroupEntity = new GroupEntity({
    id: id,
    ...event.arguments.input,
    createdOn,
  });

  logger.info(`group input info", ${JSON.stringify(groupInput)}`);
  const params = {
    TableName: tableName,
    Item: groupInput.toItem(),
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return groupInput.graphQlReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating user ${error}`);
    throw error;
  }
};
