import { CfnGraphQLApi, CfnGraphQLSchema } from "aws-cdk-lib/aws-appsync";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Role } from "aws-cdk-lib/aws-iam";

import { Construct } from "constructs";
import { readFileSync } from "fs";

interface EcomAuctionGraphqlProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  userPool: UserPool;
  cloudWatchRole: Role;
  apiSchema: CfnGraphQLSchema;
}

export class EcomAuctionGraphql extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionGraphqlProps) {
    super(scope, id);

    /**
     * GraphQL API
     */
    props.groupChatGraphqlApi = new CfnGraphQLApi(this, "groupChatGraphqlApi", {
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
    props.apiSchema = new CfnGraphQLSchema(this, "GroupChatGraphqlApiSchema", {
      apiId: props.groupChatGraphqlApi.attrApiId,
      definition: readFileSync("../schema/schema.graphql").toString(),
    });
  }
}
