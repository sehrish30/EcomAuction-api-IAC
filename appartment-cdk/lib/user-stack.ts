import { Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { CodeSigningConfig, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import { Platform, SigningProfile } from "aws-cdk-lib/aws-signer";

import { Construct } from "constructs";
import { ManagedPolicy, Role } from "aws-cdk-lib/aws-iam";

interface UserLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
  appsyncLambdaRole: Role;
}

export class ApartmentUserStack extends Stack {
  public readonly acmsGraphqlApi: CfnGraphQLApi;
  public readonly apiSchema: CfnGraphQLSchema;
  public readonly acmsTableDatasource: CfnDataSource;

  constructor(scope: Construct, id: string, props: UserLambdaStackProps) {
    super(scope, id, props);

    const { acmsDatabase, acmsGraphqlApi, apiSchema, appsyncLambdaRole } =
      props;

    /**
     * a lambda resolver to resolve all endpoints for this user entity
     */

    const lambda = this.createLambda(
      "lambda-fns/user",
      "main.ts",
      "AcmsUserHandler",
      acmsDatabase
    );
    const lambdaDataSource = this.createDataSource(
      acmsGraphqlApi,
      lambda,
      appsyncLambdaRole,
      "ACMSLambdaDatasource"
    );

    this.cfnResolver(acmsGraphqlApi, lambdaDataSource, apiSchema);
  }

  private createLambda(
    directory: string,
    functionName: string,
    lambdaName: string,
    acmsDatabase: Table
  ): NodejsFunction {
    const signingProfile = new SigningProfile(
      this,
      `SigningProfile-${functionName}`,
      {
        platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
      }
    );

    const codeSigningConfig = new CodeSigningConfig(
      this,
      `CodeSigningConfig-${functionName}`,
      {
        signingProfiles: [signingProfile],
      }
    );

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

    //Grant permissions and add dependsOn
    // groupChatTable.grantReadWriteData(lambda);
    acmsDatabase.grantFullAccess(lambda);

    //set the database table name as an environment variable for the lambda function
    lambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);

    return lambda;
  }

  private createDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    lambda: NodejsFunction,
    appsyncLambdaRole: Role,
    dataSourceName: string
  ): CfnDataSource {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      dataSourceName,
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: dataSourceName,
        type: "AWS_LAMBDA",
        lambdaConfig: {
          lambdaFunctionArn: lambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn, // assumes this role when accessing the data source
      }
    );
    return lambdaDataSources;
  }

  private cfnResolver(
    acmsGraphqlApi: CfnGraphQLApi,
    lambdaDataSources: CfnDataSource,
    apiSchema: CfnGraphQLSchema
  ) {
    const createUserAccountResolver: CfnResolver = new CfnResolver(
      this,
      "createUserAccountResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createUserAccount",
        dataSourceName: lambdaDataSources.attrName,
      }
    );

    createUserAccountResolver.addDependency(apiSchema);
  }
}
