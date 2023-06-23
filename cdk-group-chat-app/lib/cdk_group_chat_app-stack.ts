import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { EcomAuctionCfnOutputs } from "./cfnOutputs";
import { EcomAuctionCloudWatch } from "./cloud-watch";
import { EcomAuctionCognito } from "./cognito";
import { EcomAuctionDynamoDB } from "./dynamodb";
import { EcomAuctionGraphql } from "./graphql";
import { EcomAuctionIAMRole } from "./iam-role";

export class GroupChatAppStack extends Stack {
  // GRAPHQL qpi
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  // Graphql Schema
  public readonly apiSchema: CfnGraphQLSchema;
  // Database
  public readonly groupChatTable: Table;
  public readonly groupChatTableDatasource: CfnDataSource;
  public readonly IAMROLE: EcomAuctionIAMRole;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cloudwatchLogs = new EcomAuctionCloudWatch(this, "CloudWatch");
    const cognito = new EcomAuctionCognito(this, "Cognito", {});
    const graphql = new EcomAuctionGraphql(this, "Graphql", {
      userPool: cognito.userPool,
      cloudWatchRole: cloudwatchLogs.cloudWatchRole,
    });

    this.IAMROLE = new EcomAuctionIAMRole(this, "IAMRole");

    const dynamodb = new EcomAuctionDynamoDB(this, "dynamodb", {});

    this.groupChatTable = dynamodb.groupChatTable;
    this.apiSchema = graphql.apiSchema;
    this.groupChatGraphqlApi = graphql.groupChatGraphqlApi;

    const cfnOutputs = new EcomAuctionCfnOutputs(this, "cfnouput", {
      groupChatGraphqlApi: graphql.groupChatGraphqlApi,
      apiSchema: graphql.apiSchema,
      groupChatTable: dynamodb.groupChatTable,
      userPool: cognito.userPool,
      userPoolClient: cognito.userPoolClient,
    });

    this.groupChatTableDatasource = new CfnDataSource(
      this,
      "groupChatDynamoDBTableDataSource",
      {
        apiId: this.groupChatGraphqlApi.attrApiId,
        name: "AcmsDynamoDBTableDataSource",
        type: "AMAZON_DYNAMODB",
        dynamoDbConfig: {
          tableName: this.groupChatTable.tableName,
          awsRegion: this.region,
        },
        serviceRoleArn: this.IAMROLE.dynamoDBRole.roleArn,
      }
    );
  }
}
