import { AppSyncResolverHandler } from "aws-lambda";
import { JobApplication, MutationApplyToJobArgs } from "../../../appsync";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";
import { uuid } from "../utils";

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
  MutationApplyToJobArgs,
  JobApplication
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  const application = event.arguments.application;

  const id: string = uuid();

  try {
    const item = {
      jobId: application.jobId,
      username: application.username,
      jobApplicationStatus: application.jobApplicationStatus,
      ...(application.createdOn && { createdOn: application.createdOn }),
      id: id,
    };

    logger.debug(`job application input ${item}`);

    const input = {
      Item: {
        PK: `JOB#${item.jobId}#APPLICATION#${item.id}`,
        SK: `JOB#${item.jobId}#APPLICATION#${item.id}`,
        // jobApplications
        GSI1PK: `JOB#${item.jobId}`,
        GSI1SK: `APPLICATION#${item.jobId}`,
        // Job applied to
        GSI2PK: `USER#${item.username}`,
        GSI2SK: `JOB#${item.jobId}`,
        ...item,
      },
      TableName: tableName,
    };

    const command = new PutCommand(input);

    const response = await ddbDocClient.send(command);

    console.log({ response });

    return item as JobApplication;
  } catch (err) {
    logger.debug(`Error occured during job creation ${err}`);
    throw err;
  }
};
