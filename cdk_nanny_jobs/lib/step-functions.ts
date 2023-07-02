import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import {
  Chain,
  Choice,
  Condition,
  DefinitionBody,
  JsonPath,
  LogLevel,
  Map,
  Pass,
  StateMachine,
  StateMachineType,
  TaskInput,
} from "aws-cdk-lib/aws-stepfunctions";
import {
  LambdaInvoke,
  SqsSendMessage,
} from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import { join } from "path";

interface EcomAuctionStepFunctionsProps {
  babySitterTable: Table;
}

export class EcomAuctionStepFunctions extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: EcomAuctionStepFunctionsProps
  ) {
    super(scope, id);

    let babySitterLambda = this.createLambda(
      this,
      "getAllJobApplications",
      "getAllJobApplications.ts",
      props.babySitterTable
    );

    // step 1
    const getAllJobApplications = new LambdaInvoke(
      this,
      "GetAllJobApplications",
      {
        lambdaFunction: babySitterLambda,
        resultPath: "$.getItems",
      }
    );

    // step 2
    let updateJobAndApplicationStatusLambda = this.createLambda(
      this,
      "updateJobAndApplicationStatusLambda",
      "updateJobAndApplicationStatus.ts",
      props.babySitterTable
    );

    const updateJobAndApplications = new LambdaInvoke(
      this,
      "updateJobAndApplications",
      {
        lambdaFunction: updateJobAndApplicationStatusLambda,
        resultPath: "$.resultJobApplications",
      }
    );

    // step 3
    const discardJobItemFromList = new Pass(this, "discardJobItemFromList", {
      resultPath: "$.resultDiscard",
    });

    // step 4
    const map = new Map(this, "Iterate through application items", {
      maxConcurrency: 1, // 1 item in the array at a time
      itemsPath: JsonPath.stringAt("$.getItems.Payload"), // select the array to iterate over, here its products
    });

    // step 6

    const dlqqueue = new Queue(this, "DLQUpdateJobApplications", {
      queueName: "DLQUpdateJobApplications",
    });

    const UpdateJobApplicationsQueue = new Queue(
      this,
      "UpdateJobApplications",
      {
        queueName: "UpdateJobApplications",
        visibilityTimeout: Duration.seconds(20), // 6*lambdaTimeout also default 6*3
        retentionPeriod: Duration.seconds(300), // 5 minutes
        deadLetterQueue: {
          maxReceiveCount: 5, // before moving the message to dlq
          queue: dlqqueue,
        },
      }
    );

    const declineApplication = this.createLambda(
      this,
      "DeclineApplicationLambda",
      "DeclineApplication.ts",
      props.babySitterTable
    );

    // gives permission to lambda to poll our SQS queue
    UpdateJobApplicationsQueue.grantConsumeMessages(declineApplication);

    declineApplication.addEventSource(
      new SqsEventSource(UpdateJobApplicationsQueue, {
        batchSize: 5, // no of records lambda function receives
        reportBatchItemFailures: true, // Allow functions to return partially successful responses for a batch of records
      })
    );

    const pushToQueue = new SqsSendMessage(this, "PushToQueue", {
      queue: UpdateJobApplicationsQueue,
      messageBody: TaskInput.fromObject({
        data: JsonPath.stringAt("$"),
      }),
    });

    // step 5
    const sendAcceptedApplicantAMessage = new Pass(
      this,
      "sendAcceptedApplicantAMessage"
    );

    const pushDeclinedApplicationItems = new Pass(
      this,
      "pushDeclinedApplicationItems"
    );

    const checkOrderIsLessThanLimit = new Choice(
      this,
      "Filter out Accepted application Item"
    )
      .when(
        // comparing the application id of each item to the application id sent as input to the step functions
        Condition.stringEquals("$.id", "$.applicationId"),
        sendAcceptedApplicantAMessage
      )
      .otherwise(pushToQueue)
      .afterwards();

    map.iterator(checkOrderIsLessThanLimit);

    const expressLogGroup = new LogGroup(this, "ExpressLogs", {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const definition = Chain.start(getAllJobApplications)
      .next(updateJobAndApplications)
      .next(discardJobItemFromList)
      .next(map);

    let saga = new StateMachine(this, "BookANannyStateMachine", {
      definitionBody: DefinitionBody.fromChainable(definition),
      stateMachineName: "BookANannyStateMachine",
      stateMachineType: StateMachineType.EXPRESS,
      timeout: Duration.seconds(10),
      // create this log group when you use express worflow, in standard its done by default
      logs: {
        destination: expressLogGroup,
        level: LogLevel.ALL,
        includeExecutionData: true,
      },
    });
  }

  /**
   * Utility method to create Lambda blueprint
   * @param scope
   * @param id
   * @param handler
   * @param table
   * @param ecomAuctionEventBus
   */
  createLambda(scope: Construct, id: string, handler: string, table: ITable) {
    const fn = new NodejsFunction(scope, id, {
      entry: join(__dirname, `./lambda_fns/jobs/${handler}`),
      bundling: {
        externalModules: ["@aws-sdk/*"], // Use the 'aws-sdk' available in the Lambda runtime
      },
      environment: {
        BABYSITTER_DB: table.tableName, // get table name,
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(3),
    });

    // Give Lambda permissions to read and write data from the DynamoDB table and event bridge if it needs
    table.grantReadWriteData(fn);

    return fn;
  }
}

/**
 * {
  "jobId": "2RyGUO2sZzek2ygIMLcz1OiFPJO",
  "username": "farah",
  "applicationId": "2RyNnfJ4FvnJ8RjpsOrrry2N2Qj"
}
 */
