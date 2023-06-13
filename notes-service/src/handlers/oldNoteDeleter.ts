import { ScheduledEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import createError from "http-errors";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const oldNoteDeleter = async (event: ScheduledEvent) => {
  const today = new Date();

  // Get the date 2 months ago
  const twoMonthsAgo = new Date(
    today.getFullYear(),
    today.getMonth() - 2,
    today.getDate()
  );

  try {
    const scanParams = {
      TableName: process.env.NOTES_TABLE as string,
      FilterExpression: "#date < :currentDate",
      ExpressionAttributeNames: {
        "#date": "CreationDate", // The name of the date field
      },
      ExpressionAttributeValues: {
        ":currentDate": twoMonthsAgo.toISOString(), // Current date
      },
    };

    const scanCommand = new ScanCommand(scanParams);
    const scanResults = await client.send(scanCommand);

    const deletePromises = scanResults?.Items?.map((item) => {
      const deleteParams = {
        TableName: process.env.NOTES_TABLE as string,
        Key: {
          NotesId: item.NotesId,
        },
      };
      const deleteCommand = new DeleteCommand(deleteParams);
      return ddbDocClient.send(deleteCommand);
    });

    await Promise.all([deletePromises]);
  } catch (err) {
    throw new createError.InternalServerError(err);
  }
};
export const handler = oldNoteDeleter;
/**
 * serverless logs -f oldNoteDeleter
 * serverless deploy function --function oldNoteDeleter
 */
