import { DynamoDBStreamEvent, Context } from "aws-lambda";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new SNSClient({ region: process.env.AWS_REGION });

if (!process.env.TopicArn) {
  console.log("No topic arn found");
}

const input = {
  Message: "WORKING",
  TopicArn: process.env.TopicArn,
};

export const handler = async (event: DynamoDBStreamEvent, context: Context) => {
  const command = new PublishCommand(input);
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const response = await client.send(command);
};
