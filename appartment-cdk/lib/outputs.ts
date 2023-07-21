import { CfnOutput } from "aws-cdk-lib";
import { CfnGraphQLApi } from "aws-cdk-lib/aws-appsync";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface EcomAuctionApiOutputProps {
  userPool: UserPool;
  userPoolClient: UserPoolClient;
  acmsGraphqlApi: CfnGraphQLApi;
}

export class EcomAuctionApiOutput extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionApiOutputProps) {
    super(scope, id);

    const { userPool, userPoolClient, acmsGraphqlApi } = props;

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "GraphQLAPI ID", {
      value: acmsGraphqlApi.attrApiId,
    });

    new CfnOutput(this, "GraphQLAPI URL", {
      value: acmsGraphqlApi.attrGraphQlUrl,
    });
  }
}
