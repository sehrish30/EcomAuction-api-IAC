import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, Role } from "aws-cdk-lib/aws-iam";
import { CodeSigningConfig, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Platform, SigningProfile } from "aws-cdk-lib/aws-signer";
import { Construct } from "constructs";
import { join } from "path";

export const createLambdaResolver = (
  scope: Construct,
  graphqlApi: CfnGraphQLApi,
  apiSchema: CfnGraphQLSchema,
  resolverFieldName: string,
  lambdaDataSources: CfnDataSource,
  typeName: string
): CfnDataSource => {
  // create a resolver and attach the datasource to it
  const resolver: CfnResolver = new CfnResolver(scope, resolverFieldName, {
    apiId: graphqlApi.attrApiId,
    typeName: typeName,
    fieldName: resolverFieldName,
    dataSourceName: lambdaDataSources.attrName,
  });

  // Attach Lambda resolver to api schema
  // resolver depends on our graphql schema
  resolver.addDependency(apiSchema);

  return lambdaDataSources;
};

export const createLambda = (
  scope: Construct,
  functionName: string,
  lambdaName: string,
  directory: string,
  table: Table
): NodejsFunction => {
  const signingProfile = new SigningProfile(
    scope,
    `SigningProfile-${lambdaName}`,
    {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    }
  );

  const codeSigningConfig = new CodeSigningConfig(
    scope,
    `CodeSigningConfig-${lambdaName}`,
    {
      signingProfiles: [signingProfile],
    }
  );

  const lambda = new NodejsFunction(scope, lambdaName, {
    tracing: Tracing.ACTIVE,
    codeSigningConfig,
    runtime: Runtime.NODEJS_18_X,
    handler: "handler",
    entry: join(__dirname, directory, functionName),

    memorySize: 128,
  });

  //set the database table name as an environment variable for the lambda function
  lambda.addEnvironment("BABYSITTER_DB", table.tableName);

  // Assign Lambda Cloudwatch service role
  lambda.role?.addManagedPolicy(
    ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSAppSyncPushToCloudWatchLogs"
    )
  );

  //Grant permissions and add dependsOn
  table.grantReadWriteData(lambda);

  return lambda;
};

export const createDataSource = (
  scope: Construct,
  graphqlApi: CfnGraphQLApi,
  lambda: NodejsFunction,
  appsyncLambdaRole: Role,
  dataSourceName: string
): CfnDataSource => {
  const lambdaDataSources: CfnDataSource = new CfnDataSource(
    scope,
    "UserLambdaDatasource",
    {
      apiId: graphqlApi.attrApiId,
      name: dataSourceName,
      type: "AWS_LAMBDA",

      lambdaConfig: {
        lambdaFunctionArn: lambda.functionArn,
      },
      serviceRoleArn: appsyncLambdaRole.roleArn, // assumes this role when accessing the data source
    }
  );
  return lambdaDataSources;
};
