import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Role } from "aws-cdk-lib/aws-iam";
import { join } from "path";

import { Construct } from "constructs";
import { readFileSync } from "fs";

interface EcomAuctionGraphqlProps {
  userPool: UserPool;
  cloudWatchRole: Role;
}

export class EcomAuctionGraphql extends Construct {
  public readonly groupChatGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  constructor(scope: Construct, id: string, props: EcomAuctionGraphqlProps) {
    super(scope, id);

    /**
     * GraphQL API
     */
    this.groupChatGraphqlApi = new CfnGraphQLApi(this, "groupChatGraphqlApi", {
      name: "groupChat",
      authenticationType: "API_KEY", // default authorizer
      additionalAuthenticationProviders: [
        {
          authenticationType: "AMAZON_COGNITO_USER_POOLS", // more controlled access

          userPoolConfig: {
            userPoolId: props.userPool.userPoolId,
            awsRegion: "us-east-2",
          },
        },
      ],
      userPoolConfig: {
        userPoolId: props.userPool.userPoolId,
        defaultAction: "ALLOW", // make it allow if you are using additionalAuthenticationProviders
        awsRegion: "us-east-2",
      },
      //CloudWatch Logs configuration.
      logConfig: {
        fieldLogLevel: "ALL",
        cloudWatchLogsRoleArn: props.cloudWatchRole.roleArn,
      },
      xrayEnabled: true, // A flag indicating whether to use AWS X-Ray tracing for this GraphqlApi
    });

    /**
     * Graphql Schema
     */
    this.apiSchema = new CfnGraphQLSchema(this, "GroupChatGraphqlApiSchema", {
      apiId: this.groupChatGraphqlApi.attrApiId,
      definition: readFileSync(
        join(__dirname, "../schema/schema.graphql")
      ).toString(),
    });
  }
}
