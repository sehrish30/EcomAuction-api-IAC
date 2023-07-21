import { APIGatewayEvent, Context } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import createNoteSchema from "../lib/schema/createNoteSchema";
import createError from "http-errors";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const send = (statusCode: number, data: any) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
};

const createNote = async (event: APIGatewayEvent, ctx: Context) => {
  let response;

  try {
    const { id, title, body } = event.body as unknown as {
      id: string;
      title: string;
      body: string;
    };

    const note = {
      TableName: process.env.NOTES_TABLE as string,
      Item: {
        // KeySchema is must
        NotesId: id,
        Title: title,
        Body: body,
        CreationDate: new Date().toISOString(),
      },
      // check if there is already note with this id to check idempotency
      ConditionExpression: "attribute_not_exists(NotesId)",
    };
    const command = new PutCommand(note);
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.log({ err }, "ERRORRR");
    throw new createError.InternalServerError(err);
  }
  return send(201, {
    response,
  });
};

export const handler = commonMiddleware(createNote).use(
  validator({
    eventSchema: transpileSchema(createNoteSchema),
  })
);

/**
 * serverless logs -f createNote
 * serverless deploy function --function createNote
 */
