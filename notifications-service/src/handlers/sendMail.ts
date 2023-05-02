"use strict";

import { APIGatewayEvent, Context } from "aws-lambda";

const sendMail = async (event: APIGatewayEvent, ctx: Context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({message: "Gee"}),
      };
}

export const handler = sendMail