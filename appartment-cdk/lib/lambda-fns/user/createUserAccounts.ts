import { Logger } from "@aws-lambda-powertools/logger";
import UserEntity from "./userEntity";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";

import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { MutationCreateUserAccountArgs } from "../../../appsync";

type UserReturnParameters = {
  id: string;
  ENTITY: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  updatedOn: string;
  createdOn: string;
};

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

async function createUserAccount(
  appsyncInput: MutationCreateUserAccountArgs,
  logger: Logger
): Promise<UserReturnParameters> {
  const documentClient = new DynamoDB.DocumentClient();
  let tableName = process.env.ACMS_DB;

  // AWSDatetime only accepts toISOString
  const createdOn = new Date().toISOString();
  const id: string = uuid();

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const userInput: UserEntity = new UserEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });

  logger.info(`create user input info", ${JSON.stringify(userInput)}`);

  const params = {
    TableName: tableName,
    Item: userInput.toItem(),
    ConditionExpression: "attribute_not_exists(PK)", // user with that particular email doesn’t already exist in the database.
  };

  try {
    const command = new PutCommand(params);
    await ddbDocClient.send(command);

    return userInput.graphQlReturn();
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException")
      logger.error(`an error occured while creating user ${error}`);
    throw Error("A user with same email address already Exist");
  }
}
export default createUserAccount;
