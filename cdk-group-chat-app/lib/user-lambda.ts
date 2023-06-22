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
import { SigningProfile, Platform } from "aws-cdk-lib/aws-signer";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";
// https://github.com/trey-rosius/cdk_group_chat/blob/master/lib/group_lambda_stack.ts

// Create Lambda Handler
// Create and Assign Lambda Appsync role
// Assign Lambda Cloudwatch service role
// Create Lambda Datasource
// Create lambda resolver and attach to Datasource
// Attach Lambda resolver to api schema.
// Grant DynamoDB full access to lambda function

interface EcomAuctionUserLambdaProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  appsyncLambdaRole: Role;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  dynamoDBRole: Role;
}

export class EcomAuctionUserLambda extends Construct {
  public readonly groupChatTableDatasource: CfnDataSource;
  region: any;
  constructor(scope: Construct, id: string, props: EcomAuctionUserLambdaProps) {
    super(scope, id);

    // define the lambda datasource and resolver resources
    // const userLambda = this.createUserLambda();

    const userLambda = this.createLambda(
      "lambda_fns/user",
      "CreateUserAccountsLambda.ts",
      "userLambdaHandler"
    );
    const createGroupLambda = this.createLambda(
      "lambda_fns/group",
      "CreateGroupHandler.ts",
      "createGroupLambdaHandler"
    );

    const addUserToGroupLambda = this.createLambda(
      "lambda_fns/group",
      "AddUserToGroupHandler.ts",
      "addUserToGroupLambdaHandler"
    );

    const userDataSource = this.createLambdaDataSource(
      props.groupChatGraphqlApi,
      userLambda,
      props.appsyncLambdaRole,
      props.groupChatTable,
      props.apiSchema,
      "UserLambdaDatasource",
      "createUserAccount"
    );
    const createGroupLambdaDataSource = this.createLambdaDataSource(
      props.groupChatGraphqlApi,
      createGroupLambda,
      props.appsyncLambdaRole,
      props.groupChatTable,
      props.apiSchema,
      "createGroupLambdaDataSource",
      "createGroup"
    );
    const addUserToGroupDataSource = this.createLambdaDataSource(
      props.groupChatGraphqlApi,
      addUserToGroupLambda,
      props.appsyncLambdaRole,
      props.groupChatTable,
      props.apiSchema,
      "addUserToGroupDataSource",
      "addUserToGroup"
    );

    this.groupChatTableDatasource = this.getGroupsCreatedByUserDataSource(
      props.groupChatGraphqlApi,
      props.groupChatTable,
      props.apiSchema,
      props.dynamoDBRole
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

  private createLambdaDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    lambda: NodejsFunction,
    appsyncLambdaRole: Role,
    groupChatTable: Table,
    apiSchema: CfnGraphQLSchema,
    name: string,
    resolverFieldName: string
  ) {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "UserLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name,
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: lambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn, // assumes this role when accessing the data source
      }
    );

    // create a resolver and attach the datasource to it
    const createUserAccountResolver: CfnResolver = new CfnResolver(
      this,
      "createUserAccountResolver",
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
  }

  private getGroupsCreatedByUserDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    groupChatTable: Table,
    apiSchema: CfnGraphQLSchema,
    dynamoDBRole: Role
  ) {
    // datasource for this resolver, is created from the dynamoDB table
    const dataSource = new CfnDataSource(
      this,
      "groupChatDynamoDBTableDataSource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "AcmsDynamoDBTableDataSource",
        type: "AMAZON_DYNAMODB",
        dynamoDbConfig: {
          tableName: groupChatTable.tableName,
          awsRegion: this.region, // this.region is default region of the stack
        },
        serviceRoleArn: dynamoDBRole.roleArn,
      }
    );

    //  connect these vtl mapping templates to a resolver
    // Attach mapping templates and dataSource to resolver
    // since the datasource is dynamodb resolver connects to dynamodb datasource through vtl
    // vtl directly communicates to dynamodb without the need of lambda
    const getGroupsCreatedByUserResolver: CfnResolver = new CfnResolver(
      this,
      "getGroupsCreatedByUserResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllGroupsCreatedByUser",
        dataSourceName: dataSource.name,
        requestMappingTemplate: readFileSync(
          join(__dirname, "./vtl/get_groups_created_by_user_request.vtl")
        ).toString(),

        responseMappingTemplate: readFileSync(
          join(__dirname, "./vtl/get_groups_created_by_user_response.vtl")
        ).toString(),
      }
    );

    getGroupsCreatedByUserResolver.addDependency(apiSchema);

    return dataSource;
  }
}
