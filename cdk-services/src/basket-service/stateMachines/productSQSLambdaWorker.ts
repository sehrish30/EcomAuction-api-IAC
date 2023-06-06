import { SQSEvent } from "aws-lambda";
import {
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
} from "@aws-sdk/client-sfn";
import { sfnsClient } from "../sfnClient";

export const handler = async (event: SQSEvent) => {
  const record = event.Records[0];

  const body = JSON.parse(record.body as unknown as string);

  // body.body.data.taskToken
  console.log({ token: body.taskToken });
  try {
    const input = {
      // output becomes the result because of ResulltPath in yml file
      output: JSON.stringify(body),
      // taskToken is must to step function
      taskToken: body.taskToken,
    };
    const command = new SendTaskSuccessCommand(input);
    await sfnsClient.send(command);
  } catch (err) {
    console.log("===== You got an Error =====");
    console.log(err);
    const command = new SendTaskFailureCommand({
      // this error name can be used in catch clause in serverless.yml
      error: "NoCourierAvailable",
      cause: "No couriers are available",
      taskToken: body.taskToken,
    });
    await sfnsClient.send(command);
  }
};
