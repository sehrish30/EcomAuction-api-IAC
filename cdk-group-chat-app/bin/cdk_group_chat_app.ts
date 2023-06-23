#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GroupChatAppStack } from "../lib/cdk_group_chat_app-stack";
import "dotenv/config";
import { UserLamdaStacks } from "../lib/user-stack";
import { MessageStack } from "../lib/message-stack";

const app = new cdk.App();

const groupChatStack = new GroupChatAppStack(app, "CdkGroupChatAppStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const userStack = new UserLamdaStacks(app, "UserLambdaStacks", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
  IAMRole: groupChatStack.IAMROLE,
});

new MessageStack(app, "MessageLambdaStacks", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  groupChatTable: groupChatStack.groupChatTable,
  apiSchema: groupChatStack.apiSchema,
  groupChatGraphqlApi: groupChatStack.groupChatGraphqlApi,
  IAMRole: groupChatStack.IAMROLE,
  groupChatTableDatasource: groupChatStack.groupChatTableDatasource,
});
