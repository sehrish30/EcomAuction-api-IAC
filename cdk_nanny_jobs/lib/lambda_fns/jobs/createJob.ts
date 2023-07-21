import { AppSyncResolverHandler } from "aws-lambda";
import { Job, MutationCreateJobArgs } from "../../../appsync";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { uuid } from "../utils";
import { Logger } from "@aws-lambda-powertools/logger";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

export const handler: AppSyncResolverHandler<
  MutationCreateJobArgs,
  Job
> = async (event) => {
  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }
  const id: string = uuid();
  const {
    jobType,
    username,
    startDate,
    endDate,
    startTime,
    endTime,
    longitude,
    latitude,
    address,
    city,
    cost,
    jobStatus,
  } = event.arguments.job;

  const input = {
    Item: {
      PK: `USER#${username}`,
      SK: `JOB#${id}`,
      GSI1PK: `JOB#${id}`,
      GSI1SK: `JOB#${id}`,
      GSI2SK: `JOB#${id}`,
      id,
      jobType,
      username,
      startDate,
      jobStatus,
      endDate,
      startTime,
      endTime,
      longitude,
      latitude,
      address,
      city,
      cost,
    },
    TableName: tableName,
  };

  try {
    const command = new PutCommand(input);
    const response = await ddbDocClient.send(command);
    return {
      id,
      jobType,
      username,
      startDate,
      endDate,
      startTime,
      endTime,
      longitude,
      latitude,
      address,
      city,
      cost,
      jobStatus,
      applications: [],
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};
