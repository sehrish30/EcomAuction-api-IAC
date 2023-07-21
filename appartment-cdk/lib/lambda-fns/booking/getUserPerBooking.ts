import { DynamoDBDocumentClient, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AppSyncResolverEvent, Context } from "aws-lambda";
import { QueryGetAllUserAccountsArgs } from "../../../appsync";

import { Logger } from "@aws-lambda-powertools/logger";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "GetAllBookingsPerAppartment",
});

interface Booking {
  endDate: string;
  apartmentId: string;
  GSI1SK: string;
  GSI1PK: string;
  ENTITY: string;
  createdOn: string;
  userId: string;
  startDate: string;
  SK: string;
  bookingStatus: string;
  PK: string;
  id: string;
}

interface User {
  updatedOn: string;
  ENTITY: string;
  userType: string;
  createdOn: string;
  lastName: string;
  SK: string;
  email: string;
  PK: string;
  id: string;
  verified: boolean;
  firstName: string;
}

export const handler = async (
  event: AppSyncResolverEvent<QueryGetAllUserAccountsArgs>,
  context: Context
) => {
  let tableName = process.env.ACMS_DB;

  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  let items = event.prev?.result as Booking[];

  if (items?.length === 0) {
    return [{}];
  }

  interface Ikeys {
    PK: string;
    SK: string;
  }

  const keys: Ikeys[] = [];

  for (const item of items) {
    keys.push({
      PK: `USER#${item.userId}`,
      SK: `USER#${item.userId}`,
    });
  }

  const params = {
    ConsistentRead: true,
    RequestItems: {
      [tableName]: {
        Keys: keys,
      },
    },
  };

  const command = new BatchGetCommand(params);

  const response = await ddbDocClient.send(command);

  const userResponses = response.Responses?.[tableName] as User[];

  const userPopulatedItems = items.map((item, index) => {
    return {
      ...item,
      user: userResponses[index],
    };
  });

  return userPopulatedItems;
};
