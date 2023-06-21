import { CfnOutput } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface EcomAuctionCfnOutputsProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}

export class EcomAuctionCfnOutputs extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionCfnOutputsProps) {
    super(scope, id);

    new CfnOutput(this, "UserPoolId", {
      value: props.userPool?.userPoolId,
    });
    new CfnOutput(this, "UserPoolClientId", {
      value: props.userPoolClient?.userPoolClientId,
    });

    new CfnOutput(this, "GraphQLAPI ID", {
      value: props.groupChatGraphqlApi?.attrApiId,
    });

    new CfnOutput(this, "GraphQLAPI URL", {
      value: props.groupChatGraphqlApi?.attrGraphQlUrl,
    });
  }
}
