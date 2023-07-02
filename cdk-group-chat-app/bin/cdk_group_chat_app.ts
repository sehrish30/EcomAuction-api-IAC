#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { GroupChatAppStack } from "../lib/cdk_group_chat_app-stack";
import "dotenv/config";
import { UserLamdaStacks } from "../lib/user-stack";
import { MessageStack } from "../lib/message-stack";
import { GroupLamdaStacks } from "../lib/group-stack";

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

const GroupLambdaStacks = new GroupLamdaStacks(app, "GroupLambdaStacks", {
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

const messageStack = new MessageStack(app, "MessageLambdaStacks", {
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

/**
 * AWS AppSync allows you to utilize subscriptions to implement live application updates, push notifications, etc. 
 * When clients invoke the GraphQL subscription operations, a secure WebSocket connection is automatically established and maintained by AWS AppSync.
Subscriptions in AWS AppSync are invoked as a response to a mutation.
If you've noticed, these subscriptions are connected to Mutations. We use the @aws_subscribe directives to add real time capabilities to Mutations.
So a secure web socket connection would be created when a user sends a message and also when they are typing.
 */

/**
 * By having all entities in a single table, we can construct queries that return all the needed data with a single interaction with DynamoDB,
 * speeding up the performance of the application for specific access patterns.
 * But, the improved performance for specific access patterns comes at the cost of potentially reduced performance
 * for other access patterns and increased application and query complexity.
 */

/**
 * Create a file in the root directory of your project called codegen.yml
 * for apollo queries and mutation types
 * This tells graphql-codegen which schema file(s) it should use
 * what plugin (typescript) and where the output should be placed (appsync.d.ts).
 * Since we are using AWS Appsync to build out the GraphQL API, we'll be making use of AWS Appsync Scalars which aren't available in the default GraphQL Language.
 * Create another file in your project's root directory called appsync.graphql and add scalars to it.
 * In-order to generate the code, create a folder called schema and then, create a file called schema.graphql within that folder.
 *
 * add this to package.json
 * "codegen": "graphql-codegen"  👈 --- Add this
 * will create appsync.d.ts
 *
 * use those types in resolvers like
 * import { Message, MutationSendMessageArgs } from "../../../appsync";
 * export const handler: AppSyncResolverHandler<
  MutationSendMessageArgs,
  Message
> = async (event) => {
 */

/**
 * cdk deploy --all
 * cdk deploy UserLambdaStacks/GroupLambdaStacks/MessageLambdaStacks
 * cdk destroy UserLambdaStacks/GroupLambdaStacks/MessageLambdaStacks
 * cdk destroy --all
 */
