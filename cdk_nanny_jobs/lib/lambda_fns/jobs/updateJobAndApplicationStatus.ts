import { Job } from "../../../appsync";
import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

interface props {
  getItems: { Payload: Job[] };
  jobId: string;
  username: string;
  applicationId: string;
}

// Get an instance of the the DynamoDB DocumentClient
const documentClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(documentClient);

const logger = new Logger({ serviceName: "UpdateJobAndApplicationStatus" });

// "jobId": "2RyGUO2sZzek2ygIMLcz1OiFPJO",
// "username": "farah",
// "applicationId": "2RyNnfJ4FvnJ8RjpsOrrry2N2Qj"

export const handler = async ({
  getItems,
  jobId,
  username,
  applicationId,
}: props) => {
  logger.debug(`event arguments ${jobId}`);

  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  const params = {
    TransactItems: [
      {
        Update: {
          Key: {
            PK: `USER#${username}`,
            SK: `JOB#${jobId}`,
          },
          TableName: tableName,
          ConditionExpression: "username = :username",
          UpdateExpression: "SET jobStatus = :jobStatus",
          ExpressionAttributeValues: {
            ":username": username,
            ":jobStatus": "CLOSED",
          },
          ReturnValuesOnConditionCheckFailure: "ALL_OLD",
        },
      },
      {
        Update: {
          Key: {
            PK: `JOB#${jobId}APPLICATION#${applicationId}`,
            SK: `JOB#${jobId}APPLICATION#${applicationId}`,
          },
          TableName: tableName,
          UpdateExpression: "SET jobApplicationStatus = :jobApplicationStatus",
          ExpressionAttributeValues: {
            ":jobApplicationStatus": "ACCEPTED",
          },
          ReturnValuesOnConditionCheckFailure: "ALL_OLD",
        },
      },
    ],
  };

  try {
    const command = new TransactWriteCommand(params);

    const response = await ddbDocClient.send(command);

    console.log(response);

    return getItems.Payload;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
