import { Logger } from "@aws-lambda-powertools/logger";
import createBuilding from "./createBuilding";
import { AppSyncResolverEvent, Context } from "aws-lambda";
import { MutationCreateBuildingArgs } from "../../../appsync";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });


export const handler = async (
  event: AppSyncResolverEvent<MutationCreateBuildingArgs>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${event.arguments} and event info ${event.info}`
  );
  switch (event.info.fieldName) {
    case "createBuilding":
      return await createBuilding(event.arguments, logger);

    default:
      return null;
  }
};
