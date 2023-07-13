import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  CfnDataSource,
  CfnFunctionConfiguration,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver,
} from "aws-cdk-lib/aws-appsync";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  CodeSigningConfig,
  EventSourceMapping,
  Runtime,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Platform, SigningProfile } from "aws-cdk-lib/aws-signer";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";

interface ApartmentBookingLambdaStackProps extends StackProps {
  acmsGraphqlApi: CfnGraphQLApi;
  apiSchema: CfnGraphQLSchema;
  acmsDatabase: Table;
  appsyncLambdaRole: Role;
}

export class ApartmentBookingLambdaStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ApartmentBookingLambdaStackProps
  ) {
    super(scope, id, props);

    const { acmsGraphqlApi, apiSchema, acmsDatabase, appsyncLambdaRole } =
      props;

    const queue = this.createSQS();

    const createbookinglambda = this.createBookingLambda(
      "lambda-fns/booking",
      "app.ts",
      "AcmsBookingApartmentHandler",
      queue,
      acmsDatabase
    );

    const createbookinglambdaDataSource = this.createDataSource(
      acmsGraphqlApi,
      createbookinglambda,
      appsyncLambdaRole,
      "ACMSBookingApartmentLambdaDatasource"
    );

    this.createResolver(
      acmsGraphqlApi,
      createbookinglambdaDataSource,
      apiSchema,
      "Mutation",
      "createApartmentBooking"
    );

    const processSQSQueueLambda = this.createQueueConsumerLambda(
      "lambda-fns/booking",
      "processSqsBooking.ts",
      "QueueConsumerFunctionRole",
      acmsDatabase,
      queue
    );

    const lambdaDataSource = this.createDataSource(
      acmsGraphqlApi,
      processSQSQueueLambda,
      appsyncLambdaRole,
      "ACMSBookingLambdaDatasource"
    );

    this.createCfnOutput(queue);

    const getAllBookingsLambdaDataSource = this.createLambdaDataSource(
      "lambda-fns/booking",
      "getAllbookingsPerApartment.ts",
      "AcmsBuildingGetBookingsHandler",
      acmsDatabase,
      "AcmsBuildingGetBookingsDataSource",
      acmsGraphqlApi,
      appsyncLambdaRole,
      "getUserPerBooking.ts",
      "AcmsBuildingGetUser",
      "AcmsBuildingGetUserPerBookingDataSource"
    );
  }

  private createSQS() {
    const dlq = new Queue(this, "DeadLetterQueue");

    return new Queue(this, "bookingQueue", {
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 2, // number of times a message can be unsuccesfully dequeued before being moved to the dead-letter queue
      },
    });
  }
  private createBookingLambda(
    directory: string,
    functionName: string,
    lambdaName: string,
    queue: Queue,
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

    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["cloudwatch:PutMetricData"],
      resources: ["*"],
    });

    /**
     *
     * IAM role for Queue Lambda function
     */
    const lambdaRole = new Role(this, "LmbdaFunctionRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSAppSyncPushToCloudWatchLogs"
        ),
      ],
    });

    /**
     * booking function
     */
    const lambda = new NodejsFunction(this, lambdaName, {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: join(__dirname, directory, functionName),
      memorySize: 1024,
      initialPolicy: [policyStatement],
      role: lambdaRole,
    });

    // Grant access to send messages to a queue from "bookingLambda"
    queue.grantSendMessages(lambda);

    acmsDatabase.grantReadData(lambda);

    //set the database table name as an environment variable for the lambda function
    lambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);
    lambda.addEnvironment("BOOKING_QUEUE_URL", queue.queueUrl);

    return lambda;
  }

  private createQueueConsumerLambda(
    directory: string,
    functionName: string,
    lambdaName: string,
    acmsDatabase: Table,
    queue: Queue
  ) {
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

    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["cloudwatch:PutMetricData"],
      resources: ["*"],
    });

    /**
     *
     * IAM role for Queue Lambda function
     */
    const lambdaQueueRole = new Role(this, lambdaName, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        //  grants permission to invoke a Lambda function from an SQS queue
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaSQSQueueExecutionRole"
        ),
        ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSAppSyncPushToCloudWatchLogs"
        ),
      ],
    });

    /**
     * Process SQS Messages Lambda
     */
    const processSQSLambda: NodejsFunction = new NodejsFunction(
      this,
      "ProcessSqSBookingHandler",
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: Runtime.NODEJS_18_X,
        handler: "handler",
        entry: join(__dirname, directory, functionName),
        initialPolicy: [policyStatement],
        role: lambdaQueueRole,
        memorySize: 1024,
      }
    );

    //Grant permissions and add dependsOn
    acmsDatabase.grantWriteData(processSQSLambda);

    //set the database table name as an environment variable for the lambda function
    processSQSLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);

    /**
     * lambda to sqs
     */

    const eventSourceMapping = new EventSourceMapping(
      this,
      "QueueConsumerFunctionBookingEvent",
      {
        target: processSQSLambda,
        batchSize: 10,
        eventSourceArn: queue.queueArn,
        reportBatchItemFailures: true,
      }
    );

    // Grant permissions to consume messages from a queue to "processSQSLambda"
    queue.grantConsumeMessages(processSQSLambda);

    return processSQSLambda;
  }

  private createDataSource(
    bookingGraphqlApi: CfnGraphQLApi,
    lambda: NodejsFunction,
    appsyncLambdaRole: Role,
    dataSourceName: string
  ): CfnDataSource {
    const lambdaDataSources: CfnDataSource = new CfnDataSource(
      this,
      dataSourceName,
      {
        apiId: bookingGraphqlApi.attrApiId,
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

  private createResolver(
    acmsGraphqlApi: CfnGraphQLApi,
    lambdaDataSources: CfnDataSource,
    apiSchema: CfnGraphQLSchema,
    typeName: string,
    fieldName: string
  ) {
    const createBuildingResolver: CfnResolver = new CfnResolver(
      this,
      "createBuildingResolver",
      {
        apiId: acmsGraphqlApi.attrApiId,
        typeName,
        fieldName,
        dataSourceName: lambdaDataSources.attrName,
      }
    );
    createBuildingResolver.addDependency(apiSchema);
  }

  private createCfnOutput(queue: Queue) {
    new CfnOutput(this, "SQSqueueName", {
      value: queue.queueName,
      description: "SQS queue name",
    });

    new CfnOutput(this, "SQSqueueARN", {
      value: queue.queueArn,
      description: "SQS queue ARN",
    });

    new CfnOutput(this, "SQSqueueURL", {
      value: queue.queueUrl,
      description: "SQS queue URL",
    });
  }

  private createLambdaDataSource(
    directory: string,
    functionName: string,
    lambdaName: string,
    acmsDatabase: Table,
    dataSourceName: string,
    bookingGraphqlApi: CfnGraphQLApi,
    appsyncLambdaRole: Role,
    secondfunctionName: string,
    lambdaSecondName: string,
    secondDataSourceName: string
  ): CfnDataSource {
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

    const getAllBookingsPerApartmentLambda = new NodejsFunction(
      this,
      lambdaName,
      {
        tracing: Tracing.ACTIVE,
        codeSigningConfig,
        runtime: Runtime.NODEJS_18_X,
        handler: "handler",
        entry: join(__dirname, directory, functionName),

        memorySize: 1024,
      }
    );

    //Grant permissions and add dependsOn
    acmsDatabase.grantReadData(getAllBookingsPerApartmentLambda);

    const getUserPerBookingLambda = new NodejsFunction(this, lambdaSecondName, {
      tracing: Tracing.ACTIVE,
      codeSigningConfig,
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: join(__dirname, directory, secondfunctionName),
      memorySize: 1024,
    });

    // Assign Lambda Cloudwatch service role
    getAllBookingsPerApartmentLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );
    getUserPerBookingLambda.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );

    //Grant permissions and add dependsOn
    // groupChatTable.grantReadWriteData(lambda);
    acmsDatabase.grantFullAccess(getAllBookingsPerApartmentLambda);
    acmsDatabase.grantReadData(getUserPerBookingLambda);

    //set the database table name as an environment variable for the lambda function
    getAllBookingsPerApartmentLambda.addEnvironment(
      "ACMS_DB",
      acmsDatabase.tableName
    );
    getUserPerBookingLambda.addEnvironment("ACMS_DB", acmsDatabase.tableName);

    const getAllBookingsPerApartmentDataSource: CfnDataSource =
      new CfnDataSource(this, dataSourceName, {
        apiId: bookingGraphqlApi.attrApiId,
        name: dataSourceName,
        type: "AWS_LAMBDA",
        lambdaConfig: {
          lambdaFunctionArn: getAllBookingsPerApartmentLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn, // assumes this role when accessing the data source
      });

    const getUserPerBookingLambdaDataSource: CfnDataSource = new CfnDataSource(
      this,
      "getUserPerBookingLambdaDataSource",
      {
        apiId: bookingGraphqlApi.attrApiId,
        name: "getUserPerBookingLambdaDataSource",
        type: "AWS_LAMBDA",
        lambdaConfig: {
          lambdaFunctionArn: getUserPerBookingLambda.functionArn,
        },
        serviceRoleArn: appsyncLambdaRole.roleArn, // assumes this role when accessing the data source
      }
    );

    const getAllBookingsByApartmentFunction: CfnFunctionConfiguration =
      new CfnFunctionConfiguration(this, "getAllBookingsPerApartmentFunction", {
        apiId: bookingGraphqlApi.attrApiId,
        dataSourceName: getAllBookingsPerApartmentDataSource.name,
        functionVersion: "2018-05-29",
        name: "getAllBookingsPerApartmentFunction",
      });

    getAllBookingsByApartmentFunction.addDependency(
      getAllBookingsPerApartmentDataSource
    );

    const getUserPerBookingFunction: CfnFunctionConfiguration =
      new CfnFunctionConfiguration(this, "getUserPerBookingFunction", {
        apiId: bookingGraphqlApi.attrApiId,
        dataSourceName: getUserPerBookingLambdaDataSource.name,
        functionVersion: "2018-05-29",
        name: "getUserPerBookingFunction",
      });

    getUserPerBookingFunction.addDependency(getUserPerBookingLambdaDataSource);

    const getResultBookingPerApartmentResolver: CfnResolver = new CfnResolver(
      this,
      "getResultBookingPerApartmentResolver",
      {
        apiId: bookingGraphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "getAllBookingsPerApartment",

        // pipeline props kinds and pipelineConfig
        kind: "PIPELINE",
        pipelineConfig: {
          functions: [
            getAllBookingsByApartmentFunction.attrFunctionId,
            getUserPerBookingFunction.attrFunctionId,
          ],
        },
        requestMappingTemplate: readFileSync(
          join(
            __dirname,
            "./lambda-fns/vtl_templates/before_mapping_template.vtl"
          )
        ).toString(),

        responseMappingTemplate: readFileSync(
          join(
            __dirname,
            "./lambda-fns/vtl_templates/after_mapping_template.vtl"
          )
        ).toString(),
        // dataSourceName: lambdaDataSources.attrName,
      }
    );

    // readFileSync(
    //     join(__dirname, "../schema/schema.graphql")
    //   ).toString(),

    return getAllBookingsPerApartmentDataSource;
  }
}
