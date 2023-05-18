import { APIGatewayEvent } from "aws-lambda";
import { log } from "../lib/logger";

const reportingError = async (event: APIGatewayEvent) => {
  let data = JSON.parse(event.body as string);
  try {
    // create note database call
    log({
      type: "INFO",
      payload: data,
    });

    // simulating error
    throw new Error("too many database connections");
  } catch (err: any) {
    log({
      type: "CRITICAL",
      message: err.message,
      callstack: err.stack,
      payload: data,
    });
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};

export const handler = reportingError;

/**
 * serverless logs -f reportingError
 * serverless deploy function --function reportingError
 */
