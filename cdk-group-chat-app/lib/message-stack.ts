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

interface EcomAuctionMessageStackProps extends StackProps {
  groupChatGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  groupChatTable: Table;
  IAMRole: EcomAuctionIAMRole;
  groupChatTableDatasource: CfnDataSource;
}

export class MessageStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: EcomAuctionMessageStackProps
  ) {
    super(scope, id, props);

    const { groupChatTable } = props;
    const { appsyncLambdaRole } = props.IAMRole;

    const sendMessageLambda = this.createLambda(
      "lambda_fns/message",
      "SendMessageHandler.ts",
      "SendMessageLambdaHandler",
      groupChatTable
    );

    const typingIndicatorLambda = this.createLambda(
      "lambda_fns/message",
      "TypingIndicatorLambdaHandler.ts",
      "TypingIndicatorLambdaHandler",
      groupChatTable
    );

    const sendMessageLambdaDataSource = this.createLambdaDataSource(
      props.groupChatGraphqlApi,
      sendMessageLambda,
      appsyncLambdaRole,
      sendMessageLambda.functionArn,
      "MessageLambdaDatasource"
    );

    const typingIndicatorLambdaDataSource = this.createLambdaDataSource(
      props.groupChatGraphqlApi,
      sendMessageLambda,
      appsyncLambdaRole,
      typingIndicatorLambda.functionArn,
      "TypingIndicatorDataSources"
    );

    const sendMessageResolver = this.createResolvertoLambdaDataSource(
      props.groupChatGraphqlApi,
      sendMessageLambdaDataSource,
      "sendMessageResolver",
      "Mutation",
      "sendMessage",
      props.apiSchema
    );

    const typingIndicatorResolver = this.createResolvertoLambdaDataSource(
      props.groupChatGraphqlApi,
      typingIndicatorLambdaDataSource,
      "typingIndicatorResolver",
      "Mutation",
      "typingIndicator",
      props.apiSchema
    );

    const getResultMessagesPerGroupResolver =
      this.createResolverVtltoDataSource(
        props.groupChatGraphqlApi,
        props.groupChatTableDatasource,
        "Query",
        "getAllMessagesPerGroup",
        "./vtl/get_all_messages_per_group_request.vtl",
        "./vtl/get_all_messages_per_group_response.vtl",
        "getResultMessagesPerGroupResolver"
      );

    const getUserPerMessageResolver = this.createResolverVtltoDataSource(
      props.groupChatGraphqlApi,
      props.groupChatTableDatasource,
      "Message",
      "user",
      "./vtl/get_user_per_message_request.vtl",
      "./vtl/get_user_per_message_response.vtl",
      "getUserPerMessageResolver"
    );
    getUserPerMessageResolver.addDependency(getResultMessagesPerGroupResolver);
  }

  private createLambda(
    directory: string,
    functionName: string,
    lambdaName: string,
    groupChatTable: Table
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

    groupChatTable.grantFullAccess(lambda);
    lambda.addEnvironment("GroupChat_DB", groupChatTable.tableName);

    return lambda;
  }

  private createLambdaDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    sendMessageLambda: NodejsFunction,
    appsyncLambdaRole: Role,
    functionArn: string,
    dataSourceName: string
  ): CfnDataSource {
    return new CfnDataSource(this, dataSourceName, {
      apiId: groupChatGraphqlApi.attrApiId,
      name: dataSourceName,
      type: "AWS_LAMBDA",

      lambdaConfig: {
        lambdaFunctionArn: functionArn,
      },
      serviceRoleArn: appsyncLambdaRole.roleArn,
    });
  }

  private createResolvertoLambdaDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    lambdaDataSources: CfnDataSource,
    resolverName: string,
    typeName: string,
    fieldName: string,
    apiSchema: CfnGraphQLSchema
  ): CfnResolver {
    const resolver = new CfnResolver(this, resolverName, {
      apiId: groupChatGraphqlApi.attrApiId,
      typeName,
      fieldName,
      dataSourceName: lambdaDataSources.attrName,
    });
    resolver.addDependency(apiSchema);
    return resolver;
  }

  private createResolverVtltoDataSource(
    groupChatGraphqlApi: CfnGraphQLApi,
    dataSource: CfnDataSource,
    typeName: string,
    fieldName: string,
    requestVtlTemplate: string,
    responseVtlTemplate: string,
    resolverName: string
  ): CfnResolver {
    const resolver: CfnResolver = new CfnResolver(this, resolverName, {
      apiId: groupChatGraphqlApi.attrApiId,
      typeName,
      fieldName,
      dataSourceName: dataSource.name,
      requestMappingTemplate: readFileSync(
        join(__dirname, requestVtlTemplate)
      ).toString(),
      responseMappingTemplate: readFileSync(
        join(__dirname, responseVtlTemplate)
      ).toString(),
    });

    return resolver;
  }
}

/**
 * As the name suggests, the sendMessage mutation is used for sending messages in the group.

Displaying a typing indicator when a user is typing a message is an essential feature for every chat system.

That's why we have a mutation called typingIndicator and we would use a subscription to provide real time updates, when somebody in a group is typing.
 */
