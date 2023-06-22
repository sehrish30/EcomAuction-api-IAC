import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcomAuctionIAMRole } from "./iam-role";
import { EcomAuctionUserLambda } from "./user-lambda";
import { EcomAuctionGraphql } from "./graphql";
import { EcomAuctionCognito } from "./cognito";
import { EcomAuctionDynamoDB } from "./dynamodb";

interface UserLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
}

export class UserLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
    super(scope, id, props);

    const IAMRole = new EcomAuctionIAMRole(this, "IAMROLE", {});
    // const cognito = new EcomAuctionCognito(this, "Cognito", {});
    // const graphql = new EcomAuctionGraphql(this, "Graphql", {
    //   userPool: cognito.userPool,
    //   cloudWatchRole: IAMRole.appsyncLambdaRole,
    // });
    // const dynamodb = new EcomAuctionDynamoDB(this, "DynamoDB", {});
    new EcomAuctionUserLambda(this, "Lambda", {
      groupChatGraphqlApi: props.groupChatGraphqlApi,
      appsyncLambdaRole: IAMRole.appsyncLambdaRole,
      apiSchema: props.apiSchema,
      groupChatTable: props.groupChatTable,
      dynamoDBRole: IAMRole.dynamoDBRole
    });

    const { groupChatGraphqlApi, groupChatTable, apiSchema } = props;
    // using a lambda resolver to resolve all endpoints for this user entity
  }
}
