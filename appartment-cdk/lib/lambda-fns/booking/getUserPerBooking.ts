import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AppSyncResolverEvent, Context } from "aws-lambda";
import { QueryGetAllUserAccountsArgs } from "../../../appsync";

import { Logger } from "@aws-lambda-powertools/logger";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "GetAllBookingsPerAppartment",
});

// const keys = ctx.prev.result.items.map((item) => ({
//     PK: `USER#${item.userId}`,
//     SK: `USER#${item.userId}`
//   }));

export const handler = async (
  event: AppSyncResolverEvent<QueryGetAllUserAccountsArgs>,
  context: Context
) => {
  let tableName = process.env.ACMS_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const params = {
    TableName: tableName,
    ConsistentRead: true,
    RequestItems: {
      [tableName]: {
        Keys: {},
      },
    },
  };
};
