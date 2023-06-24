import {
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
  CfnDataSource,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcomAuctionIAMRole } from "./iam-role";
import { ManagedPolicy, Role } from "aws-cdk-lib/aws-iam";
import { CodeSigningConfig, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { SigningProfile, Platform } from "aws-cdk-lib/aws-signer";

interface UserLambdaStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  IAMRole: EcomAuctionIAMRole;
}

export class UserLamdaStacks extends Stack {
  // public readonly groupChatDatasource: CfnDataSource;
  region: any;

  constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
    super(scope, id, props);
    const { appsyncLambdaRole, dynamoDBRole } = props.IAMRole;

    const { groupChatGraphqlApi, groupChatTable, apiSchema } = props;
    // using a lambda resolver to resolve all endpoints for this user entity

    // define the lambda datasource and resolver resources
    const userLambda = this.createLambda(
      "lambda_fns/user",
      "CreateUserAccountsLambda.ts",
      "userLambdaHandler",
    );
  

    const lambdaDataSources = this.createDataSource(
      props.groupChatGraphqlApi,
      userLambda,
      appsyncLambdaRole
    );

    const userDataSource = this.createLambdaResolver(
      props.groupChatGraphqlApi,
      userLambda,
      props.groupChatTable,
      props.apiSchema,
      "createUserAccount",
      "createUserAccountResolver",
      lambdaDataSources
    );
  }

  private createLambda(
    directory: string,
    functionName: string,
    lambdaName: string
  ): NodejsFunction {
    const signingProfile = new SigningProfile(this, "SigningProfile", {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new CodeSigningConfig(this, "CodeSigningConfig", {
      signingProfiles: [signingProfile],
    });

    const lambda = new NodejsFunction(this, lambdaName, {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: join(__dirname, directory, functionName),
      memorySize: 1024,
    });

    // Assign Lambda Cloudwatch service role
    lambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    return lambda;
  }

  private createDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    lambda: NodejsFunction,
    appsyncLambdaRole: Role
  ): CfnDataSource {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "UserLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "UserLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: lambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn, // assumes this role when accessing the data source
      }
    );
    return lambdaDataSources;
  }

  private createLambdaResolver(
    groupChatGraphqlApi: CfnGraphQLApi,
    lambda: NodejsFunction,
    groupChatTable: Table,
    apiSchema: CfnGraphQLSchema,
    resolverFieldName: string,
    resolverName: string,
    lambdaDataSources: CfnDataSource
  ): CfnDataSource {
    // create a resolver and attach the datasource to it
    const createUserAccountResolver: CfnResolver = new CfnResolver(
      this,
      resolverName,
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: resolverFieldName,
        dataSourceName: lambdaDataSources.attrName,
      }
    );

    // Attach Lambda resolver to api schema
    // resolver depends on our graphql schema
    createUserAccountResolver.addDependency(apiSchema);

    //Grant permissions and add dependsOn
    groupChatTable.grantFullAccess(lambda);

    //set the database table name as an environment variable for the lambda function
    lambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);

    return lambdaDataSources;
  }

  private groupChatDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    groupChatTable: Table,
    dynamoDBRole: Role
  ) {
    // datasource for this resolver, is created from the dynamoDB table
    return new CfnDataSource(this, "groupChatDynamoDBTableDataSource", {
      apiId: groupChatGraphqlApi.attrApiId,
      name: "AcmsDynamoDBTableDataSource",
      type: "AMAZON_DYNAMODB",
      dynamoDbConfig: {
        tableName: groupChatTable.tableName,
        awsRegion: this.region, // this.region is default region of the stack
      },
      serviceRoleArn: dynamoDBRole.roleArn,
    });
  }
}

/**
 * When you create a Lambda data source, you define a mapping template that transforms the GraphQL query or mutation into
 * an input payload for the Lambda function.
 * The Lambda function then processes the input payload and returns a response,
 * which is then transformed by a response mapping template
 * into the GraphQL response format.
 * The choice of data source and resolver implementation depends on your use case and requirements.
 * AppSync uses VTL to translate GraphQL requests from clients into a request to your data source.
 * Then it reverses the process to translate the data source response back into a GraphQL response
 * How to resolve nested fields in Graphql with CDK, Appsync and VTL.
 * typeName is the field type from the api schema, and the fieldName is the attribute.
 * The source map contains the resolution of the parent field.
 *  We'll get the groupId from this map and pass it into the get group request template.
 */
