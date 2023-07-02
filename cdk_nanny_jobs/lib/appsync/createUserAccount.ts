import {
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { ManagedPolicy, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { CodeSigningConfig, Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Platform, SigningProfile } from "aws-cdk-lib/aws-signer";
import { Construct } from "constructs";
import { join } from "path";

import { EcomAuctionIAMRole } from "../iam-role";

interface EcomAuctionCreateUserAccountProps {
  babySitterTable: Table;
  graphqlApi: CfnGraphQLApi;
  iamRole: EcomAuctionIAMRole;
  apiSchema: CfnGraphQLSchema;
  userPoolId: string;
  cognitoPolicy: PolicyStatement;
}

export class EcomAuctionCreateUserAccount extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: EcomAuctionCreateUserAccountProps
  ) {
    super(scope, id);

    const { graphqlApi, babySitterTable, iamRole, apiSchema, cognitoPolicy } =
      props;

    const createUserLambda = this.createLambda(
      "createUserAccount.ts",
      "createUserAccount",
      "../lambda_fns/users",
      babySitterTable,
      props.userPoolId,
      cognitoPolicy
    );

    const lambdaDataSources = this.createDataSource(
      graphqlApi,
      createUserLambda,
      iamRole.appsyncLambdaRole,
      "CreateUserDataSource"
    );

    // TypeName and FieldName which corresponds to what we have in the GraphQl Schema
    const createUser = this.createLambdaResolver(
      graphqlApi,
      apiSchema,
      "createUser",
      lambdaDataSources, // points to our dataSource
      "Mutation"
    );

    /************************/

    const createAdminLambda = this.createLambda(
      "createAdminAccount.ts",
      "createAdminAccount",
      "../lambda_fns/users",
      babySitterTable,
      props.userPoolId,
      props.cognitoPolicy
    );

    const lambdaDataSource = this.createDataSource(
      graphqlApi,
      createAdminLambda,
      iamRole.appsyncLambdaRole,
      "CreateAdminDataSource"
    );

    // TypeName and FieldName which corresponds to what we have in the GraphQl Schema
    const createAdmin = this.createLambdaResolver(
      graphqlApi,
      apiSchema,
      "createAdmin",
      lambdaDataSource, // points to our dataSource
      "Mutation"
    );

    /************************/

    const createParentLambda = this.createLambda(
      "createParent.ts",
      "createParentAccount",
      "../lambda_fns/users",
      babySitterTable,
      props.userPoolId,
      props.cognitoPolicy
    );

    const parentlambdaDataSource = this.createDataSource(
      graphqlApi,
      createParentLambda,
      iamRole.appsyncLambdaRole,
      "CreateParentDataSource"
    );

    // TypeName and FieldName which corresponds to what we have in the GraphQl Schema
    const createParent = this.createLambdaResolver(
      graphqlApi,
      apiSchema,
      "createParent",
      parentlambdaDataSource, // points to our dataSource
      "Mutation"
    );
  }

  private createLambdaResolver(
    graphqlApi: CfnGraphQLApi,
    apiSchema: CfnGraphQLSchema,
    resolverFieldName: string,
    lambdaDataSources: CfnDataSource,
    typeName: string
  ): CfnDataSource {
    // create a resolver and attach the datasource to it
    const resolver: CfnResolver = new CfnResolver(this, resolverFieldName, {
      apiId: graphqlApi.attrApiId,
      typeName: typeName,
      fieldName: resolverFieldName,
      dataSourceName: lambdaDataSources.attrName,
    });

    // Attach Lambda resolver to api schema
    // resolver depends on our graphql schema
    resolver.addDependency(apiSchema);

    return lambdaDataSources;
  }

  private createLambda(
    functionName: string,
    lambdaName: string,
    directory: string,
    table: Table,
    userPoolId: string,
    cognitoPolicy: PolicyStatement
  ): NodejsFunction {
    const signingProfile = new SigningProfile(
      this,
      `SigningProfile-${lambdaName}`,
      {
        platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
      }
    );

    const codeSigningConfig = new CodeSigningConfig(
      this,
      `CodeSigningConfig-${lambdaName}`,
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

    // assign lambda policy to add user to congito group
    lambda.addToRolePolicy(cognitoPolicy);

    //Grant permissions and add dependsOn
    table.grantReadWriteData(lambda);

    //set the database table name as an environment variable for the lambda function
    lambda.addEnvironment("BABYSITTER_DB", table.tableName);
    lambda.addEnvironment("USERPOOL_ID", userPoolId);

    return lambda;
  }

  private createDataSource(
    graphqlApi: CfnGraphQLApi,
    lambda: NodejsFunction,
    appsyncLambdaRole: Role,
    dataSourceName: string
  ): CfnDataSource {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      dataSourceName,
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
  }
}
