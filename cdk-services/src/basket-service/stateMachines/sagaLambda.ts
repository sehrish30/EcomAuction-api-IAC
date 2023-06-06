import { APIGatewayEvent } from "aws-lambda";
import { StartExecutionCommand } from "@aws-sdk/client-sfn";
import { sfnsClient } from "../sfnClient";
import { ddbClient } from "../ddbClient";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const handler = async (event: APIGatewayEvent) => {
  const tableParams = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
  };

  const { Items } = await ddbClient.send(new ScanCommand(tableParams));

  const unMarshalledItems = Items?.map((item) => unmarshall(item)) || [];

  console.log({ unMarshalledItems });

  // can modify the input here
  const params = {
    // StartExecutionInput
    stateMachineArn: process.env.statemachineArn, // required
    input: JSON.stringify({ products: unMarshalledItems }),
  };
  const command = new StartExecutionCommand(params);
  try {
    const response = await sfnsClient.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
