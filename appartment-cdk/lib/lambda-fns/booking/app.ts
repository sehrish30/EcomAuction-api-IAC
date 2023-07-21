//  polls for bookings(messages) in the queue and saves them to dynamoDB
// In this fashion, we have completely decoupled the application, making it more scalable and performant, by taking booking processing, off the main thread.

import { Logger } from "@aws-lambda-powertools/logger";

import { AppSyncResolverEvent, Context } from "aws-lambda";
import { MutationCreateApartmentBookingArgs } from "../../../appsync";

import { Tracer } from "@aws-lambda-powertools/tracer";
import { createApartmentBooking } from "./createApartmentBooking";

const namespace = "ApartmentComplexManagementApp";
const serviceName = "bookingHandler";

const logger = new Logger({ logLevel: "INFO", serviceName: serviceName });
const tracer = new Tracer({ serviceName: serviceName });

export const handler = async (
  event: AppSyncResolverEvent<MutationCreateApartmentBookingArgs>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${JSON.stringify(
      event.arguments.input
    )} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartmentBooking":
      return await createApartmentBooking(event.arguments, logger);

    default:
      return null;
  }
};
