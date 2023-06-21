import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { EcomAuctionCfnOutputs } from "./cfnOutputs";
import { EcomAuctionCloudWatch } from "./cloud-watch";
import { EcomAuctionCognito } from "./cognito";
import { EcomAuctionDynamoDB } from "./dynamodb";
import { EcomAuctionGraphql } from "./graphql";

export class CdkGroupChatAppStack extends Stack {
  // public readonly groupChatGraphqlApi: CfnGraphQLApi;
  // public readonly apiSchema: CfnGraphQLSchema;
  // public readonly groupChatTable: Table;
  // public readonly groupChatTableDatasource: CfnDataSource;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cloudwatchLogs = new EcomAuctionCloudWatch(this, "CloudWatch");
    const cognito = new EcomAuctionCognito(this, "Cognito", {});
    const graphql = new EcomAuctionGraphql(this, "Graphql", {
      userPool: cognito.userPool,
      cloudWatchRole: cloudwatchLogs.cloudWatchRole,
    });

    const dynamodb = new EcomAuctionDynamoDB(this, "dynamodb", {});

    const cfnOutputs = new EcomAuctionCfnOutputs(this, "cfnouput", {
      groupChatGraphqlApi: graphql.groupChatGraphqlApi,
      apiSchema: graphql.apiSchema,
      groupChatTable: dynamodb.groupChatTable,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
    });
  }
}
