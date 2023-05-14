import { APIGatewayEvent, Context } from "aws-lambda";
import commonMiddleware from "../lib/commonMiddleware";
import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import createError from "http-errors";
import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import getAllNotesSchema from "../lib/schema/getAllNotesSchema";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";

/**
 * Partion key is used for: Partion of that data item, it uses hash function to determine the value
   Sort key: arranging the items within partition also can use for multiple queries
 */

const requestHandler = new NodeHttpHandler({
  connectionTimeout: 30000,
  socketTimeout: 30000,
});

// subsequent lambda functions can reuse those http connections
// if using aws-sdk V3 (JavaScript) by default the TCP connection is reused, so no change required.
// for v2 we had to use environment AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
  requestHandler,
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const getAllNotes = async (event: APIGatewayEvent, ctx: Context) => {
  let response;
  console.log("START", process.env.AWS_REGION);
  const { pageSize, LastEvaluatedKey } =
    event.queryStringParameters as unknown as {
      pageSize: string;
      LastEvaluatedKey: Record<string, AttributeValue> | undefined;
    };
  console.log({ pageSize, LastEvaluatedKey });
  const numPageSize = +pageSize;
  try {
    let input = {
      TableName: process.env.NOTES_TABLE as string,
      Limit: numPageSize,
      // order may appear rough or logical at times use Query for sorting order
      // get latest data first used pagination to avoid large response
    } as ScanCommandInput;
    console.log("NEWWWW", LastEvaluatedKey);
    if (LastEvaluatedKey) {
      // ExclusiveStartKey = retrieve additional pages of results
      input.ExclusiveStartKey = {
        NotesId: LastEvaluatedKey,
      };
    }

    const command = new ScanCommand(input);
    response = await ddbDocClient.send(command);
  } catch (err) {
    console.log({ err: err.message });
    throw new createError.InternalServerError(err);
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      response, // response.Items, response.LastEvaluatedKey.NotesId
    }),
  };
};

export const handler = commonMiddleware(getAllNotes).use(
  validator({
    eventSchema: transpileSchema(getAllNotesSchema, {
      // @ts-ignore
      ajvOptions: {
        // if queryStringParameters were not defined
        // we will set default value as defined in the schema
        useDefaults: true,
        // user can provide or skip query parameters wont throw an error and useDefaults property will use default value from schema
        strict: false,
      },
    }),
  })
);

/**
 *  serverless deploy function --function getAllNotes
   serverless logs -f getAllNotes --startTime 1h
 */
