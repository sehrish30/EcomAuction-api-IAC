#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppartmentCdkStack } from "../lib/apartment-cdk-stack";
import { ApartmentUserStack } from "../lib/user-stack";
import { BuildingLamdaStacks } from "../lib/building-stack";
import { EcomAuctionApartmentStack } from "../lib/apartment-lambda-stack";
import { ApartmentBookingLambdaStack } from "../lib/booking-lamda-stack";
import { DdbStreamLamdaStack } from "../lib/db-stream-lambda-stack";

const app = new cdk.App();
const acmsStack = new AppartmentCdkStack(app, "AppartmentCdkStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new ApartmentUserStack(app, "ApartmentUserStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
  appsyncLambdaRole: acmsStack.appsyncLambdaRole,
});

new BuildingLamdaStacks(app, "BuildingLambdaStacks", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
  appsyncLambdaRole: acmsStack.appsyncLambdaRole,
});

new EcomAuctionApartmentStack(app, "AppartmentLambdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
  appsyncLambdaRole: acmsStack.appsyncLambdaRole,
});

new ApartmentBookingLambdaStack(app, "AppartmentBookingLambdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  acmsDatabase: acmsStack.acmsDatabase,
  apiSchema: acmsStack.apiSchema,
  acmsGraphqlApi: acmsStack.acmsGraphqlApi,
  appsyncLambdaRole: acmsStack.appsyncLambdaRole,
})


new DdbStreamLamdaStack(app, "DdbStreamLamdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  acmsDatabase: acmsStack.acmsDatabase,
})