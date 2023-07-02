import {
  CfnApiKey,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";

interface EcomAuctionAppSyncProps {
  userPool: UserPool;
  cloudWatchRole: Role;
  region: string;
}

export class EcomAuctionAppSync extends Construct {
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly graphqlApi: CfnGraphQLApi;

  constructor(scope: Construct, id: string, props: EcomAuctionAppSyncProps) {
    super(scope, id);

    const { region } = props;

    // appsync graphqlapi
    const cfnGraphQLApi = new CfnGraphQLApi(this, "BabySitterApi", {
      authenticationType: "API_KEY",
      name: "BabySitterApi",

      // the properties below are optional
      additionalAuthenticationProviders: [
        {
          authenticationType: "AMAZON_COGNITO_USER_POOLS",
          // authentication with cognito
          userPoolConfig: {
            awsRegion: region,
            userPoolId: props.userPool.userPoolId,
          },
        },
      ],

      logConfig: {
        cloudWatchLogsRoleArn: props.cloudWatchRole.roleArn,
        excludeVerboseContent: false,
        fieldLogLevel: "ALL",
      },
      // authentication with api keys
      userPoolConfig: {
        userPoolId: props.userPool.userPoolId,
        defaultAction: "ALLOW", // make it allow if you are using additionalAuthenticationProviders
        awsRegion: region,
      },
      xrayEnabled: true, // A flag indicating whether to use AWS X-Ray tracing for this GraphqlApi
    });

    this.graphqlApi = cfnGraphQLApi;

    // resource creates a unique key that you can distribute to clients who are executing GraphQL operations with AWS AppSync that require an API key
    // This API_KEY is valid for 7 days after which it has to be regenerated again
    const cfnApiKey = new CfnApiKey(this, "BabySitterApiKey", {
      apiId: cfnGraphQLApi.attrApiId, // Unique AWS AppSync GraphQL API identifier
    });

    // data model for your API
    const cfnGraphQLSchema = new CfnGraphQLSchema(
      this,
      "BabySitterGraphqlSchema",
      {
        apiId: cfnGraphQLApi.attrApiId,
        definition: readFileSync(
          join(__dirname, "../schema/schema.graphql")
        ).toString(),
      }
    );
    this.apiSchema = cfnGraphQLSchema;
  }
}
