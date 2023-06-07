import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { captureAWSv3Client } from "aws-xray-sdk";

var key = "hello";
var value = "there"; // must be string, boolean or finite number

// enables X-Ray tracing for all requests made with the `dynamodb` client.
export const ddbClient = new DynamoDBClient({});
// captureAWSv3Client(new DynamoDBClient({})

// https://github.com/aws/aws-xray-sdk-node/blob/master/packages/core/README.md
