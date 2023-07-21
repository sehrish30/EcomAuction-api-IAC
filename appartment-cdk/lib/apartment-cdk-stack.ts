import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
} from "aws-cdk-lib/aws-appsync";
import {
  AccountRecovery,
  CfnUserPoolGroup,
  UserPool,
  UserPoolClient,
  VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, Role } from "aws-cdk-lib/aws-iam";

import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";
import { EcomApartmentCloudWatch } from "./cloud-watch";
import { EcomAuctionApiOutput } from "./outputs";

export class AppartmentCdkStack extends Stack {
  public readonly acmsGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly acmsTableDatasource: CfnDataSource;
  public userPoolClient: UserPoolClient;
  public readonly acmsDatabase: Table;
  public readonly appsyncLambdaRole: Role;

  public readonly userPool: UserPool;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.userPool = this.createCognito();

    const cloudWatch = new EcomApartmentCloudWatch(this, "Cloudwatch");

    this.appsyncLambdaRole = cloudWatch.appsyncLambdaRole;

    this.acmsGraphqlApi = this.createGraphqlAPI(
      this.userPool,
      cloudWatch.cloudWatchRole
    );

    this.apiSchema = this.createGraphlSchema(this.acmsGraphqlApi);
    this.acmsDatabase = this.createAcmsDatabase();

    this.acmsTableDatasource = this.createDataSource(
      cloudWatch.cloudWatchRole,
      this.acmsDatabase,
      this.acmsGraphqlApi
    );

    new EcomAuctionApiOutput(this, "output", {
      userPool: this.userPool,
      userPoolClient: this.userPoolClient,
      acmsGraphqlApi: this.acmsGraphqlApi,
    });
  }

  private createCognito(): UserPool {
    /**
     * UserPool and UserPool Client
     * With this auth type, users can see a list of all available buildings on the platform.
     * But they’ll need to be signed in and assigned to a particular group,
     * in-order to progress through the rest of the api endpoints.
     */
    const userPool: UserPool = new UserPool(this, "ACMSCognitoUserPool", {
      selfSignUpEnabled: true, // Whether self sign up should be enabled
      accountRecovery: AccountRecovery.PHONE_AND_EMAIL, // How will a user be able to recover their account
      userVerification: {
        emailStyle: VerificationEmailStyle.CODE, // Configuration around users signing themselves up to the user pool
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      removalPolicy: RemovalPolicy.DESTROY, // remove it when cdk destroy
    });

    // we can add custom domain as well
    userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: "ecom-auction-app",
      },
    });

    const userPoolClient: UserPoolClient = new UserPoolClient(
      this,
      "ACMSUserPoolClient",
      {
        userPool,
        oAuth: {
          flows: {
            // jwt token will be returned back to client
            // and not be hidden or use back channel for this
            implicitCodeGrant: true,
          },
          callbackUrls: ["http://localhost:3000/callback"],
        },
      }
    );

    this.userPoolClient = userPoolClient;

    new CfnUserPoolGroup(this, "Tenants", {
      userPoolId: userPool.userPoolId,
      groupName: "Tenants",
      precedence: 123,
    });
    new CfnUserPoolGroup(this, "Admins", {
      userPoolId: userPool.userPoolId,
      groupName: "Admins",
      precedence: 1,
    });
    new CfnUserPoolGroup(this, "Caretakers", {
      userPoolId: userPool.userPoolId,
      groupName: "Caretakers",
      precedence: 12,
    });

    return userPool;
  }

  private createGraphqlAPI(userPool: UserPool, cloudwatchRole: Role) {
    /**
     * GraphQL API
     */
    return new CfnGraphQLApi(this, "acmsGraphqlApi", {
      name: "ACMS",
      authenticationType: "API_KEY",

      additionalAuthenticationProviders: [
        {
          authenticationType: "AMAZON_COGNITO_USER_POOLS",

          userPoolConfig: {
            userPoolId: userPool.userPoolId,
            awsRegion: "us-east-2",
          },
        },
      ],
      userPoolConfig: {
        userPoolId: userPool.userPoolId,
        defaultAction: "ALLOW",
        awsRegion: "us-east-2",
      },

      // CloudWatch Logs configuration
      logConfig: {
        fieldLogLevel: "ALL",
        cloudWatchLogsRoleArn: cloudwatchRole.roleArn,
      },
      xrayEnabled: true,
    });
  }

  private createGraphlSchema(api: CfnGraphQLApi) {
    return new CfnGraphQLSchema(this, "ACMSGraphqlApiSchema", {
      apiId: api.attrApiId,
      definition: readFileSync(
        join(__dirname, "./schema/schema.graphql")
      ).toString(),
    });
  }

  private createDataSource(
    dynamoDBRole: Role,
    acmsDatabase: Table,
    acmsGraphqlApi: CfnGraphQLApi
  ) {
    return new CfnDataSource(this, "AcmsDynamoDBTableDataSource", {
      apiId: acmsGraphqlApi.attrApiId,
      name: "AcmsDynamoDBTableDataSource",
      type: "AMAZON_DYNAMODB",
      dynamoDbConfig: {
        tableName: acmsDatabase.tableName,
        awsRegion: this.region,
      },
      serviceRoleArn: dynamoDBRole.roleArn,
    });
  }

  private createAcmsDatabase(): Table {
    const table = new Table(this, "ACMSDynamoDbTable", {
      tableName: "AcmsDynamoDBTable",

      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },

      billingMode: BillingMode.PAY_PER_REQUEST,
      // the entire item, as it appears after it was modified, is written to the stream.
      stream: StreamViewType.NEW_IMAGE,

      removalPolicy: RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
      indexName: "getAllApartmentsPerUser",
      partitionKey: {
        name: "GSI1PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });

    return table;
  }
}
