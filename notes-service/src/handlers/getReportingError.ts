import { APIGatewayEvent } from "aws-lambda";
import { log } from "../lib/logger";

const getReportingError = async (event: APIGatewayEvent) => {
  const { id: noteId } = event.pathParameters as { id: string };
  try {
    const queryTime = 500;
    if (queryTime > 100) {
      log({
        type: "WARNING",
        message: `Query time ${queryTime} is longer than accepted 100ms`,
        payload: `Note Id: ${noteId}`,
      });
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};

export const handler = getReportingError;

/**
 * serverless logs -f getReportingError
 * serverless deploy function --function getReportingError
 */
