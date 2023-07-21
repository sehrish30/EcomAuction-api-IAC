import { APIGatewayEvent } from "aws-lambda";

// https://github.com/leegilmorecode/serverless-lambda-layers/blob/main/src/generate-screenshot.ts
// go into the lambda layer folder go to specific file index.ts and run this command "tsc index.ts"
// include this in tsconfig.json for layers to work,  "include": ["src/**/*.ts", "src/layers/**/node_modules/**/*"]

import log from "logging";

// import log from "logger";
// https://www.npmjs.com/package/serverless-latest-layer-version

//  { log: { __esModule: true, default: [Function: handler] } }
// lambda layer e.g for recording metrices , logging
const reportingError = async (event: APIGatewayEvent) => {
  let data = JSON.parse(event.body as string);
  console.log({ log });
  // const log = logger?.default;

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
      // at which line this error occured
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
 * tsc index.ts
 */

/**
 * Challenges in Active/Active
  Race Condition(Due to concurrent request)
  Dynamo db uses (Last writer wins) for conflict resolution in DynamoDb
  Cap theorem (Consistency Or availability, Partition tolerance)
  Partition tolerance, we need this for data replication.
  stale data will be available if the data replication is not complete.
 */
