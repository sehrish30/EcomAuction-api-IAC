import {
    SFNClient,

  } from "@aws-sdk/client-sfn";

export const sfnsClient = new SFNClient({
    region: process.env.AWS_REGION,
});
  