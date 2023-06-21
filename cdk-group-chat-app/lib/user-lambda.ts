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
import { join } from "path";

interface EcomAuctionUserLambdaProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  appsyncLambdaRole: Role;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
}

export class EcomAuctionUserLambda extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionUserLambdaProps) {
    super(scope, id);

    // define the lambda datasource and resolver resources
    const userLambda = this.createUserLambda();
    const userToGroupLambda = this.addUserToGroupLambda();
    const datasource = this.createUserDataSource(
      props.groupChatGraphqlApi,
      userLambda,
      props.appsyncLambdaRole,
      props.groupChatTable,
      props.apiSchema
    );
  }

  private createUserLambda(): NodejsFunction {
    // first create a code signing profile in AWS Signer
    // which includes the signing algorithm
    const signingProfile = new SigningProfile(this, "SigningProfile", {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new CodeSigningConfig(this, "CodeSigningConfig", {
      signingProfiles: [signingProfile],
    });

    // only valid signature function is deployed
    return new NodejsFunction(this, "GroupChatUserHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: join(__dirname, "lambda_fns/user", "CreateUserAccountsLambda.ts"),
      memorySize: 1024,
    });
  }

  private addUserToGroupLambda() {
    const signingProfile = new SigningProfile(this, "SigningProfile", {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new CodeSigningConfig(this, "CodeSigningConfig", {
      signingProfiles: [signingProfile],
    });

    const addUserToGroupLambda = new NodejsFunction(
      this,
      "addUserToGroupLambdaHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: Runtime.NODEJS_18_X,
        handler: "handler",
        entry: join(__dirname, "lambda_fns/group", "AddUserToGroupHandler.ts"),

        memorySize: 1024,
      }
    );

    addUserToGroupLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );
    return addUserToGroupLambda;
  }

  private createGroupLambda() {
    const signingProfile = new SigningProfile(this, "SigningProfile", {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    });

    const codeSigningConfig = new CodeSigningConfig(this, "CodeSigningConfig", {
      signingProfiles: [signingProfile],
    });

    const createGroupLambda = new NodejsFunction(this, "GroupLambdaHandler", {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: join(__dirname, "lambda_fns/group", "CreateGroupHandler.ts"),

      memorySize: 1024,
    });

    createGroupLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    return createGroupLambda;
  }

  private createUserDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    userLambda: NodejsFunction,
    appsyncLambdaRole: Role,
    groupChatTable: Table,
    apiSchema: CfnGraphQLSchema
  ) {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "UserLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "UserLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: userLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    // create a resolver and attach the datasource to it
    const createUserAccountResolver: CfnResolver = new CfnResolver(
      this,
      "createUserAccountResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createUserAccount",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
    //Grant permissions and add dependsOn

    createUserAccountResolver.addDependency(apiSchema);
    groupChatTable.grantFullAccess(userLambda);
    //set the database table name as an environment variable for the lambda function
    userLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
  }

  private createGroupResource(
    groupChatGraphqlApi: CfnGraphQLApi,
    apiSchema: CfnGraphQLSchema,
    appsyncLambdaRole: Role,
    groupChatTable: Table
  ) {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      "GroupLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "GroupLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: createGroupLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    //create a resolver and attach the datasource to it
    // resolver depends on our graphql schema
    const createGroupResolver: CfnResolver = new CfnResolver(
      this,
      "createGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "createGroup",
        dataSourceName: lambdaDataSources.attrName,
      }
    );
    createGroupResolver.addDependency(apiSchema);
    groupChatTable.grantFullAccess(createGroupLambda);
    createGroupLambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);
  }
  private addUserToGroupDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    apiSchema: CfnGraphQLSchema,
    appsyncLambdaRole: Role,
    groupChatTable: Table
  ) {
    const addUserToGroupDataSources: CfnDataSource = new CfnDataSource(
      this,
      "AddUserToGroupLambdaDatasource",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        name: "AddUserToGroupLambdaDatasource",
        type: "AWS_LAMBDA",

        lambdaConfig: {
          lambdaFunctionArn: addUserToGroupLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn,
      }
    );

    const addUserToGroupResolver: CfnResolver = new CfnResolver(
      this,
      "addUserToGroupResolver",
      {
        apiId: groupChatGraphqlApi.attrApiId,
        typeName: "Mutation",
        fieldName: "addUserToGroup",
        dataSourceName: addUserToGroupDataSources.attrName,
      }
    );
    addUserToGroupResolver.addDependency(apiSchema);
    groupChatTable.grantFullAccess(addUserToGroupLambda);
    addUserToGroupLambda.addEnvironment(
      "GroupChat_DB",
      groupChatTable.tableName
    );
  }
}
