import { EventBridgeClient } from "@aws-sdk/client-eventbridge";

export const ebClient = new EventBridgeClient({
  region: process.env.AWS_REGION,
});

// connection management will be handled one time for our lambda execution
// by this way we will reduce execution time and reduce the concurrency of lambda function
