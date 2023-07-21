import { AppSyncResolverHandler } from "aws-lambda";
import { MutationUpdateUserArgs, User } from "../../../appsync";
import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const logger = new Logger({ serviceName: "UpdateUserAccountsHandler" });

// Get an instance of the the DynamoDB DocumentClient
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: AppSyncResolverHandler<
  MutationUpdateUserArgs,
  User
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.BABYSITTER_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);

  try {
    const {
      username,
      firstName,
      lastName,
      address,
      about,
      longitude,
      latitude,
    } = event.arguments.user;

    const input = {
      TableName: tableName,
      Key: {
        // KeySchema is must
        PK: `USER#${username}`,
        SK: `USER#${username}`,
      },
      // some reserved words we cant use in UpdateExpression
      UpdateExpression:
        "set firstName= :firstName, lastName= :lastName, address= :address, about= :about, longitude= :longitude, latitude= :latitude",
      ExpressionAttributeValues: {
        ":firstName": firstName,
        ":lastName": lastName,
        ":address": address,
        ":about": about,
        ":longitude": longitude,
        ":latitude": latitude,
      },
      // update only if item is present in dynamo db else throw err, idempotency
      ConditionExpression: "attribute_exists(PK)",
      ReturnValues: "ALL_NEW",
    };

    const command = new UpdateCommand(input);

    const response = await ddbDocClient.send(command);
    console.log(response);

    return {
      ...event.arguments.user,
      ...response.Attributes,
    } as User;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
