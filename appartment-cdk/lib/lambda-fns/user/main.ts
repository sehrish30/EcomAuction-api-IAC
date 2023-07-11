import { Logger } from "@aws-lambda-powertools/logger";
import createUserAccount from "./createUserAccounts";
import { AppSyncResolverEvent, Context } from "aws-lambda";
import { MutationCreateUserAccountArgs } from "../../../appsync";

const logger = new Logger({ serviceName: "ApartmentComplexManagementApp" });

export const handler = async (
  event: AppSyncResolverEvent<MutationCreateUserAccountArgs>,
  context: Context
) => {
  logger.addContext(context);
  logger.info(
    `appsync event arguments ${JSON.stringify(event.arguments.input)}`
  );

  switch (event.info.fieldName) {
    case "createUserAccount":
      return await createUserAccount(event.arguments, logger);

    default:
      return null;
  }
};
