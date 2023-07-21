import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDB } from "aws-sdk";
import { uuid } from "../../utils";

import { ApartmentEntity } from "./entities/apartmentEntity";

import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ApartmentInput, MutationCreateApartmentArgs } from "../../../appsync";
import CreateApartmentInput from "./CreateApartmentInput";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

async function createApartment(
  appsyncInput: MutationCreateApartmentArgs,
  logger: Logger
) {
  const documentClient = new DynamoDB.DocumentClient();

  let tableName = process.env.ACMS_DB;
  const createdOn = Date.now().toString();
  const id: string = uuid();

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const apartmentInput: ApartmentEntity = new ApartmentEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
    kitchen: false,
  });

  logger.info(`create apartment input info", ${apartmentInput}`);

  const params = {
    TableName: tableName,
    Item: apartmentInput.toItem(),
  };

  try {
    const command = new PutCommand(params);
    await ddbDocClient.send(command);

    return apartmentInput.graphQLReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating an apartment ${error}`);
    throw Error(`an error occured ${error}`);
  }
}

export default createApartment;
