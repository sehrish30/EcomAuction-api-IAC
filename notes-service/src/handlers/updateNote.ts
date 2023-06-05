import { APIGatewayEvent, Context } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import updateNoteSchema from "../lib/schema/updateNoteSchema";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const updateNote = async (event: APIGatewayEvent, ctx: Context) => {
  let response;
  let { noteId } = event.pathParameters as unknown as { noteId: string };

  try {
    const { title, body } = event.body as unknown as {
      id: string;
      title: string;
      body: string;
    };
    const note = {
      TableName: process.env.NOTES_TABLE!,
      Key: {
        // KeySchema is must
        NotesId: noteId,
      },
      // some reserved words we cant use in UpdateExpression
      UpdateExpression: "set #title= :title, #body= :body",
      ExpressionAttributeNames: {
        "#title": "Title",
        "#body": "Body",
      },
      ExpressionAttributeValues: {
        ":title": title,
        ":body": body,
      },
      // update only if item is present in dynamo db else throw err, idempotency
      ConditionExpression: "attribute_exists(NotesId)",
    };
    const command = new UpdateCommand(note);
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        err: "Server error",
      }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      response,
    }),
  };
};

export const handler = commonMiddleware(updateNote).use(
  validator({
    eventSchema: transpileSchema(updateNoteSchema),
  })
);

/**
 * serverless logs -f updateNote
 * serverless deploy function --function updateNote
 */
