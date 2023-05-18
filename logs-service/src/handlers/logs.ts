import { APIGatewayEvent } from "aws-lambda";

const logs = async (event: APIGatewayEvent) => {
  console.log("SEHRISHHHH");
  const error = {
    type: "CRITICAL",
    message: "Too many connections",
  };
  // all logs go to cloudwatch
  // lets stream those logs in kinesis firehouse
  // https://www.serverless.com/plugins/serverless-plugin-log-subscription
  console.log(JSON.stringify(error));

  return {
    statusCode: 200,
    body: JSON.stringify(error),
  };
};
export const handler = logs;
/**
 * serverless logs -f logs
 * serverless deploy function --function logs
 */
