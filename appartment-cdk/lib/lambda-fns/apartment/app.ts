import { Logger } from "@aws-lambda-powertools/logger";
import createApartment from "./createApartment";
import { AppSyncResolverEvent, Context } from "aws-lambda";

import CreateApartmentInput from "./CreateApartmentInput";
import { MutationCreateApartmentArgs } from "../../../appsync";
const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

export const handler = async (
  event: AppSyncResolverEvent<MutationCreateApartmentArgs>,
  context: Context
) => {
  logger.addContext(context);


  logger.info(
    `appsync event arguments ${JSON.stringify(
      event.arguments.input
    )} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createApartment":
      return await createApartment(event.arguments, logger);

    default:
      return null;
  }
};
