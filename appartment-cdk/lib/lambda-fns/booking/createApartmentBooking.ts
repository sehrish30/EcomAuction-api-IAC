//  takes the below input, bundles it up and sends it to an SQS queue
// the function first checks to see if this particular user has a PENDING booking status for this apartment.
// If a user’s booking status for an apartment is PENDING , they can’t make subsequent bookings for same apartment.

import { Logger } from "@aws-lambda-powertools/logger";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { uuid } from "../../utils";
import { BookingEntity } from "./entities/bookingEntity";
import { MutationCreateApartmentBookingArgs } from "../../../appsync";

import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  apiVersion: "2012-08-10",
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const sqsclient = new SQSClient({ region: process.env.AWS_REGION });

export const createApartmentBooking = async (
  appsyncInput: MutationCreateApartmentBookingArgs,
  logger: Logger
): Promise<boolean> => {
  let tableName = process.env.ACMS_DB;
  let BOOKING_QUEUE_URL = process.env.BOOKING_QUEUE_URL;
  const createdOn = Date.now().toString();
  const id: string = uuid();

  if (BOOKING_QUEUE_URL === undefined) {
    logger.error(`Couldn't get the queue url name`);
    throw Error("Couldn't get queue url");
  }

  const bookingInput: BookingEntity = new BookingEntity({
    id: id,
    ...appsyncInput.input,
    createdOn,
  });
  if (tableName === undefined) {
    logger.error(`Couldn't get the table name`);
    tableName = "AcmsDynamoDBTable";
  }

  logger.info(`create booking input info", ${JSON.stringify(bookingInput)}`);

  const params = {
    TableName: tableName,
    IndexName: "getAllApartmentsPerUser",
    KeyConditionExpression: "#GSI1PK = :GSI1PK AND #GSI1SK = :GSI1SK",
    FilterExpression: "#bookingStatus = :bookingStatus",
    ExpressionAttributeNames: {
      "#GSI1PK": "GSI1PK",
      "#GSI1SK": "GSI1SK",
      "#bookingStatus": "bookingStatus",
    },
    ExpressionAttributeValues: {
      ":GSI1PK": `USER#${appsyncInput.input.userId}`,
      ":GSI1SK": `APARTMENT#${appsyncInput.input.apartmentId}`,
      ":bookingStatus": "PENDING",
    },
  };

  //We want to make sure this particular user doesn't already have a pending booking for this apartment.
  const command = new QueryCommand(params);
  const response = await ddbDocClient.send(command);

  if (response.Count != null) {
    //No pending booking, send booking to SQS

    if (response.Count <= 0) {
      logger.info(`sqs pre message ${JSON.stringify(bookingInput.toItem())}`);
      logger.info(`sqs  queue url ${BOOKING_QUEUE_URL}`);

      const input = {
        MessageBody: JSON.stringify(bookingInput.toItem()),
        QueueUrl: BOOKING_QUEUE_URL,
      };

      const command = new SendMessageCommand(input);

      try {
        await sqsclient.send(command);
        return true;
      } catch (error) {
        logger.info(`an error occured while sending message to sqs", ${error}`);
        throw Error(`an error occured while sending message to sqs", ${error}`);
      }
    }
    //Pending Booking,don't send any message to SQS
    else {
      throw new Error("You Already have a pending booking for this apartment");
    }
  } else {
    throw new Error("Error Querying pending bookings");
  }
};
