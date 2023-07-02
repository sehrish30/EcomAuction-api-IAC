#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkNannyJobsStack } from "../lib/cdk_nanny_jobs-stack";

const app = new cdk.App();

new CdkNannyJobsStack(app, "CdkNannyJobsStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
