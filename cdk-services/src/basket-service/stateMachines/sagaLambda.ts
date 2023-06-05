import { APIGatewayEvent } from "aws-lambda";

export const handler = (event: APIGatewayEvent) => {
  return {
    statusCode: 200,
  };
};
