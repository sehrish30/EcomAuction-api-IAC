import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

//imported generated types
import { User, MutationCreateUserArgs } from "../../../appsync";
// utility functions to generate ksuid's and execute dynamodb transactions
import { uuid, executeTransactWrite } from "../utils";

/*
The Logger utility must always be instantiated outside the Lambda handler.
By doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, Logger can keep track of a cold start and inject the appropriate fields into logs.
*/
const logger = new Logger({ serviceName: "CreateUserAccountsHandler" });

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoclient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const handler: AppSyncResolverHandler<
  MutationCreateUserArgs,
  User
> = async (event) => {
  logger.debug(`appsync event arguments ${JSON.stringify(event)}`);

  // Get an instance of the the DynamoDB DocumentClient
  const documentClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
  });

  // Get the dynamodb table name of the environment variable.
  let tableName = process.env.BABYSITTER_DB;
  const userPoolId = process.env.USERPOOL_ID;

  const createdOn: number = Date.now();
  // get a unique ksuid
  const id: string = uuid();

  if (tableName === undefined || userPoolId === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "babySitterTable";
  }

  logger.info(`message input info", ${JSON.stringify(event.arguments)}`);

  // grab user submitted input from the input arguments
  const {
    username,
    email,
    profilePicUrl,
    type,
    day,
    month,
    year,
    age,
    dateOfBirth,
    male,
    female,
    firstName,
    lastName,
    address,
    about,
    longitude,
    latitude,
    status,
  } = event.arguments.user;

  const cognitoParams = {
    UserPoolId: userPoolId,
    Username: username,
    GroupName: "nanny",
  };

  const command = new AdminAddUserToGroupCommand(cognitoParams);

  try {
    await cognitoclient.send(command);
  } catch (err) {
    console.log(err);
    throw err;
  }

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

            type: type,

            firstName: firstName,

            lastName: lastName,

            day: day,

            month: month,

            year: year,

            age: age,

            male: male,

            female: female,

            ...(dateOfBirth && { dateOfBirth }),

            address: address,

            about: about,

            longitude: longitude,

            latitude: latitude,

            status: status,

            // jobsAppliedTo
            GSI2PK: `USER#${username}`,
            GSI2SK: `USER#${username}`,
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

            username: username,

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
      ...event.arguments.user,
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
