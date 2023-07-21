import { Logger } from "@aws-lambda-powertools/logger";
import { MutationCreateBuildingArgs } from "../../../appsync";
import { uuid } from "../../utils";
import { BuildingEntity } from "./entities/buildingEntity";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

async function createBuilding(
  appsyncInput: MutationCreateBuildingArgs,
  logger: Logger
) {
  let tableName = process.env.ACMS_DB;

  const createdOn = new Date().toISOString();

  const id: string = uuid();

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  const input: BuildingEntity = new BuildingEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });

  logger.info(`create building input info", ${JSON.stringify(input)}`);

  const params = {
    TableName: tableName,
    Item: input.toItem(),
  };

  try {
    const command = new PutCommand(params);
    await ddbDocClient.send(command);

    console.log({ data: input.graphQlReturn() });

    return input.graphQlReturn();
  } catch (error: any) {
    logger.error(`an error occured while creating a building ${error}`);
    throw Error(`an error occured ${error}`);
  }
}

export default createBuilding;
