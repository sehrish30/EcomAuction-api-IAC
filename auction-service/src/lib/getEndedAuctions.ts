import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2",
  apiVersion: "2012-08-10",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function getEndedAuctions() {
  const now = new Date();
  /**
   * keyConditionExpression here we specify value
    for our partition key and sort key

    ExpressionAttributeValues populate those values
    by converting it into ISOString it becomes string and
    dynamo db can work with that string and filter on it

    ExpressionAttributeNames is useful for reserverd words
    will replace status in KeyConditionExpression with status variable
    because status is reserved word
   */
  const input = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "StatusAndEndDate",
    ExpressionAttributeValues: {
      ":status": "OPEN",
      ":now": now.toISOString(),
    },
    ExpressionAttributeNames: {
      "#status": "Status",
    },
    KeyConditionExpression: "#status = :status AND EndingAt <= :now",
  };
  const command = new QueryCommand(input);
  const response = await ddbDocClient.send(command);
  return response.Items ? response.Items : [];
}
