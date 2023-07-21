import { Job } from "../../../appsync";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";

import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";

interface props {
  data: {
    jobId: string;
    applicationId: string;
  };
}

// Get an instance of the the DynamoDB DocumentClient
const documentClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(documentClient);

const logger = new Logger({ serviceName: "UpdateJobAndApplicationStatus" });

export const handler = async (record: SQSEvent) => {
  const records = record.Records;

  const batchItemFailures = [] as { itemIdentifier: string }[];

  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  /**
     * Handle messages from SQS Queue containing job applications.
    Update each job application status to DECLINED
     */
  logger.info(`payload has ${records.length} records`);

  // const newPayload =  JSON.parse(payload)

  records.forEach(async (sqsRecord) => {
    const payload: string = sqsRecord.body;
    const item = JSON.parse(payload) as props;

    const { jobId, applicationId } = item.data;

    const params = {
      TableName: tableName,
      Key: {
        PK: `JOB#${jobId}#APPLICATION#${applicationId}`,
        SK: `JOB#${jobId}#APPLICATION#${applicationId}`,
      },
      ConditionExpression: "attribute_exists(PK)",
      UpdateExpression: `set jobApplicationStatus = :jobApplicationStatus`,
      ExpressionAttributeValues: {
        ":jobApplicationStatus": "DECLINED",
      },
      ReturnValues: "ALL_NEW",
    };
    try {
      const response = await ddbDocClient.send(new UpdateCommand(params));
      logger.debug(`${response}`);
      console.log({ items: response.Attributes });
    } catch (err) {
      console.log(err);
      batchItemFailures.push({
        itemIdentifier: sqsRecord.messageId,
      });
    }
  });

  return batchItemFailures;
};
