import { APIGatewayEvent } from "aws-lambda";
import { StartExecutionCommand } from "@aws-sdk/client-sfn";
import { sfnsClient } from "../sfnClient";

export const handler = async (event: APIGatewayEvent) => {
  // can modify the input here
  const params = {
    // StartExecutionInput
    stateMachineArn: process.env.statemachineArn, // required
    input: JSON.stringify(event.body),
  };
  const command = new StartExecutionCommand(params);
  try {
    await sfnsClient.send(command);
  } catch (err) {
    console.log(err);
    throw err;
  }
  return {
    statusCode: 200,
  };
};
