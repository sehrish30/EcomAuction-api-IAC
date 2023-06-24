import { Stack, StackProps } from "aws-cdk-lib";
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
import { readFileSync } from "fs";
import { join } from "path";
import { EcomAuctionIAMRole } from "./iam-role";

interface GroupStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  IAMRole: EcomAuctionIAMRole;
  groupChatTableDatasource: CfnDataSource;
}

export class GroupLamdaStacks extends Stack {
  constructor(scope: Construct, id: string, props: GroupStackProps) {
    super(scope, id, props);

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

    const createGroupDataSource = this.createDataSource(
      props.groupChatGraphqlApi,
      createGroupLambda,
      props.IAMRole.appsyncLambdaRole,
      "GroupLambdaDatasource"
    );

    const addUserToGroupDataSource = this.createDataSource(
      props.groupChatGraphqlApi,
      createGroupLambda,
      props.IAMRole.appsyncLambdaRole,
      "AddUserToGroupLambdaDatasource"
    );

    const addUserToGroupResolver = this.createLambdaResolver(
      props.groupChatGraphqlApi,
      addUserToGroupLambda,
      props.groupChatTable,
      props.apiSchema,
      "createGroup",
      "createGroupResolver",
      createGroupDataSource
    );
    const createGroupResolver = this.createLambdaResolver(
      props.groupChatGraphqlApi,
      addUserToGroupLambda,
      props.groupChatTable,
      props.apiSchema,
      "addUserToGroup",
      "addUserToGroupResolver",
      addUserToGroupDataSource
    );

    this.getVtlResolver(
      props.groupChatGraphqlApi,
      props.apiSchema,
      props.groupChatTableDatasource,
      "getAllGroupsCreatedByUser",
      "Query",
      "./vtl/get_groups_created_by_user_response.vtl",
      "./vtl/get_groups_created_by_user_request.vtl",
      "getAllGroupsCreatedByUserResolver"
    );

    this.getVtlResolver(
      props.groupChatGraphqlApi,
      props.apiSchema,
      props.groupChatTableDatasource,
      "getGroupsUserBelongsTo",
      "Query",
      "./vtl/get_groups_user_belongs_to_request.vtl",
      "./vtl/get_groups_user_belongs_to_response.vtl",
      "getGroupsCreatedByUserResolver"
    );
    this.getVtlResolver(
      props.groupChatGraphqlApi,
      props.apiSchema,
      props.groupChatTableDatasource,
      "group",
      "UserGroup",
      "./vtl/get_group_request.vtl",
      "./vtl/get_group_response.vtl",
      "getUserGroupResolver"
    );
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

  private createLambda(
    directory: string,
    functionName: string,
    lambdaName: string
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

    return lambda;
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
    const resolver: CfnResolver = new CfnResolver(this, resolverName, {
      apiId: groupChatGraphqlApi.attrApiId,
      typeName: "Mutation",
      fieldName: resolverFieldName,
      dataSourceName: lambdaDataSources.attrName,
    });

    // Attach Lambda resolver to api schema
    // resolver depends on our graphql schema
    resolver.addDependency(apiSchema);

    //Grant permissions and add dependsOn
    groupChatTable.grantFullAccess(lambda);

    //set the database table name as an environment variable for the lambda function
    lambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);

    return lambdaDataSources;
  }

  private getVtlResolver(
    groupChatGraphqlApi: CfnGraphQLApi,
    apiSchema: CfnGraphQLSchema,
    groupChatTableDatasource: CfnDataSource,
    fieldName: string,
    typeName: string,
    requestTemplate: string,
    responseTemplate: string,
    resolverName: string
  ) {
    //  connect these vtl mapping templates to a resolver
    // Attach mapping templates and dataSource to resolver
    // since the datasource is dynamodb resolver connects to dynamodb datasource through vtl
    // vtl directly communicates to dynamodb without the need of lambda
    // resolver using vtl
    const vtlResolver: CfnResolver = new CfnResolver(this, resolverName, {
      apiId: groupChatGraphqlApi.attrApiId,
      typeName,
      fieldName,
      dataSourceName: groupChatTableDatasource.name,
      requestMappingTemplate: readFileSync(
        join(__dirname, requestTemplate)
      ).toString(),

      responseMappingTemplate: readFileSync(
        join(__dirname, responseTemplate)
      ).toString(),
    });

    // Attach resolver to graphql schema
    vtlResolver.addDependency(apiSchema);
  }
}
