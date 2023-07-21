import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";

import { Job, QueryListAllJobsArgs } from "../../../appsync";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

/*
The Logger utility must always be instantiated outside the Lambda handler.
By doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, Logger can keep track of a cold start and inject the appropriate fields into logs.
*/
const logger = new Logger({ serviceName: "GetJobByStatusHandler" });

export const handler: AppSyncResolverHandler<
  QueryListAllJobsArgs,
  Job[]
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);
  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  const jobStatus = event.arguments.jobStatus;

  try {
    const input = {
      ExpressionAttributeValues: {
        ":jobStatus": jobStatus,
      },
      KeyConditionExpression: "jobStatus = :jobStatus",
      TableName: tableName,
      ScanIndexForward: true,
      IndexName: "getJobsByStatus",
    };
    const command = new QueryCommand(input);
    const response = await ddbDocClient.send(command);
    const jobs = response.Items;
    return jobs as Job[];
  } catch (err) {
    console.log(err);
    throw err;
  }
};
