import { AppSyncResolverHandler } from "aws-lambda";
import { QueryGetUserArgs, User } from "../../../appsync";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";

import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

/*
The Logger utility must always be instantiated outside the Lambda handler.
By doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, Logger can keep track of a cold start and inject the appropriate fields into logs.
*/
const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: AppSyncResolverHandler<QueryGetUserArgs, User> = async (
  event
) => {
  const username = event.arguments.username;

  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);
  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${username}`,
        SK: `USER#${username}`,
      },
    });

    const response = await ddbDocClient.send(command);

    console.log(response);

    return response.Item ? (response.Item as User) : ({} as User);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
