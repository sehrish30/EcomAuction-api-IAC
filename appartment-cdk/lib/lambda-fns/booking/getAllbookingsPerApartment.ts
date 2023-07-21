import { AppSyncResolverEvent, Context } from "aws-lambda";
import { QueryGetAllBookingsPerApartmentArgs } from "../../../appsync";

import { Logger } from "@aws-lambda-powertools/logger";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "GetAllBookingsPerAppartment",
});

export const handler = async (
  event: AppSyncResolverEvent<QueryGetAllBookingsPerApartmentArgs>,
  context: Context
) => {
  let tableName = process.env.ACMS_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  let params = {
    TableName: tableName,
    KeyConditionExpression: "#PK = :pk and begins_with(#SK, :sk)",
    ExpressionAttributeNames: {
      "#PK": "PK",
      "#SK": "SK",
    },
    ExpressionAttributeValues: {
      ":pk": `APARTMENT#${event.arguments.apartmentId}`,
      ":sk": "BOOKING#",
    },
    ScanIndexForward: true,
    Limit: event.arguments.limit,
    ...(event.arguments.nextToken && {
      ExclusiveStartKey: JSON.parse(event.arguments.nextToken),
    }),
  };

  const command = new QueryCommand(params);
  try {
    const response = await ddbDocClient.send(command);

    return response.Items;
  } catch (err) {
    logger.info(`an error occured while sending query command", ${err}`);
    console.log(err);
    throw err;
  }
};
