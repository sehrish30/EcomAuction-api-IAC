"use strict";

import { APIGatewayEvent, Context } from "aws-lambda";

const calculateTotal = async (event: APIGatewayEvent, ctx: Context) => {};

export const handler = calculateTotal;

/**
 * serverless logs -f checkInventory
 * serverless deploy function --function checkInventory
 */
