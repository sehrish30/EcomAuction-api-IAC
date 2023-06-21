import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

//imported generated types
import { User, MutationCreateUserAccountArgs } from "../../../appsync";
// utility functions to generate ksuid's and execute dynamodb transactions
import { uuid, executeTransactWrite } from "../../utils";

/*
The Logger utility must always be instantiated outside the Lambda handler.
By doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, Logger can keep track of a cold start and inject the appropriate fields into logs.
*/
const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

export const handler: AppSyncResolverHandler<
  MutationCreateUserAccountArgs,
  User
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  // Get an instance of the the DynamoDB DocumentClient
  const documentClient = new DynamoDB.DocumentClient();
  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.GroupChat_DB;

  const createdOn: number = Date.now();
  // get a unique ksuid
  const id: string = uuid();

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "groupChatDynamoDBTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);

  // grab user submitted input from the input arguments
  const { username, email, profilePicUrl } = event.arguments.input;

  const params = {
    TransactItems: [
      // two items are inserted into the DynamoDB table with unique PK attributes with transaction
      // because i want both to be inserted at once
      {
        Put: {
          Item: {
            id: id,

            ENTITY: "USER", //  identifies the type of entity being inserted.

            PK: `USER#${username}`,

            SK: `USER#${username}`,

            username: username,

            email: email,

            profilePicUrl: profilePicUrl,

            createdOn: createdOn,
          },
          TableName: tableName,
          // maintain uniqueness by adding a conditional expression
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
      {
        Put: {
          Item: {
            id: id,

            ENTITY: "USER",

            PK: `USEREMAIL#${email}`,

            SK: `USEREMAIL#${email}`,

            email: email,

            createdOn: createdOn,
          },
          TableName: tableName,
          ConditionExpression: "attribute_not_exists(PK)",
        },
      },
    ],
  };

  try {
    // using a transactWrite because of its atomic feature. Either all the requests succeed, or all fail.
    // atomic feature
    await executeTransactWrite(params, documentClient);
    return {
      id,
      username,
      email,
      profilePicUrl,
    };
  } catch (error: any) {
    logger.error(`an error occured while sending message ${error}`);
    logger.error("Error creating user account");

    let errorMessage = "Could not create user account";

    if (error.code === "TransactionCanceledException") {
      if (error.cancellationReasons[0].Code === "ConditionalCheckFailed") {
        errorMessage = "User with this username already exists.";
      } else if (
        error.cancellationReasons[1].Code === "ConditionalCheckFailed"
      ) {
        errorMessage = "User with this email already exists.";
      }
    }

    // In case of a failure, we catch the exception and return a user-friendly message back through the graphql api
    throw new Error(errorMessage);
  }
};
