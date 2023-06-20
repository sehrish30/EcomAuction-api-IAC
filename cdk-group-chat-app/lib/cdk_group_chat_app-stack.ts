import * as cdk from "aws-cdk-lib";
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
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkGroupChatAppStack extends cdk.Stack {
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly groupChatTable: Table;
  public readonly groupChatTableDatasource: CfnDataSource;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cloudwatchLogs = new EcomAuctionCloudWatch(this, "CloudWatch");
    const cognito = new EcomAuctionCognito(this, "Cognito", {});
    const graphql = new EcomAuctionGraphql(this, "Graphql", {
      groupChatGraphqlApi: this.groupChatGraphqlApi,
      userPool: cognito.userPool,
      cloudWatchRole: cloudwatchLogs.cloudWatchRole,
      apiSchema: this.apiSchema,
    });

    const dynamodb = new EcomAuctionDynamoDB(this, "dynamodb", {
      groupChatTable: this.groupChatTable,
    });

    const cfnOutputs = new EcomAuctionCfnOutputs(this, "cfnouput", {
      groupChatGraphqlApi: this.groupChatGraphqlApi,
      apiSchema: this.apiSchema,
      groupChatTable: this.groupChatTable,
      groupChatTableDatasource: this.groupChatTableDatasource,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
    });
  }
}
