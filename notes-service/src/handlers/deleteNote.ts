import { APIGatewayEvent, Context } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const deleteNote = async (event: APIGatewayEvent, ctx: Context) => {
  let { noteId } = event.pathParameters as { noteId: string };
  let response;
  try {
    const params = {
      TableName: process.env.NOTES_TABLE as string,
      Key: {
        NotesId: noteId,
      },
      // delete only if item is present in dynamo db else throw err, idempotency
      ConditionExpression: "attribute_exists(NotesId)",
    };
    const command = new DeleteCommand(params);
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.log({ err });
    throw new createError.InternalServerError(err);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `${noteId} deleted successfully`,
    }),
  };
};

export const handler = commonMiddleware(deleteNote);
