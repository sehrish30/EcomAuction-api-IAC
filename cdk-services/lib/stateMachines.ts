import { Construct } from "constructs";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import {
  Chain,
  Choice,
  Fail,
  IntegrationPattern,
  LogLevel,
  Parallel,
  Pass,
  StateMachine,
  StateMachineType,
  Succeed,
  TaskInput,
  Condition,
} from "aws-cdk-lib/aws-stepfunctions";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { join } from "path";
import { LambdaInvoke, SnsPublish } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { ITopic } from "aws-cdk-lib/aws-sns";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { IEventBus } from "aws-cdk-lib/aws-events";

interface EcomAuctionProps {
  basketTable: ITable;
  ecomAuctionEventBus: IEventBus;
  checkoutTopic: ITopic;
}

/**
 * Saga Pattern StepFunction
 * 1) Validation check
 * 2) Get basket of user
 * 3) Publish checkout event
 * 4) Delete basket
 */

export class EcomAuctionStateMachine extends Construct {
  public CheckoutMachineArn: string;
  public CheckoutStateMachine: StateMachine;

  constructor(scope: Construct, id: string, props: EcomAuctionProps) {
    super(scope, id);
    this.CheckoutStateMachine = this.createCheckoutStateMachine(props);
  }

  /**
   * Utility method to create Lambda blueprint
   * @param scope
   * @param id
   * @param handler
   * @param table
   * @param ecomAuctionEventBus
   */
  createLambda(
    scope: Construct,
    id: string,
    handler: string,
    table: ITable,
    ecomAuctionEventBus?: IEventBus
  ) {
    const fn = new NodejsFunction(scope, id, {
      entry: join(
        __dirname,
        `./../src/basket-service/stateMachines/${handler}`
      ),
      bundling: {
        externalModules: ["@aws-sdk/*"], // Use the 'aws-sdk' available in the Lambda runtime
      },
      environment: {
        PRIMARY_KEY: "username",
        DYNAMODB_TABLE_NAME: table.tableName, // get table name,
        EVENT_DETAIL_TYPE: "CheckoutBasket",
        EVENT_BUSNAME: "EcomAuctionEventBus",
        EVENT_SOURCE: "com.ecomAuction.basket.checkoutbasket",
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(3),
    });

    // Give Lambda permissions to read and write data from the DynamoDB table and event bridge if it needs
    table.grantReadWriteData(fn);
    ecomAuctionEventBus?.grantPutEventsTo(fn);
    return fn;
  }

  private createCheckoutStateMachine(props: EcomAuctionProps): StateMachine {
    /**
     * Create Lambda Functions for checkout
     */

    let validationCheckLambda = this.createLambda(
      this,
      "validationCheckFunction",
      "validationCheck.ts",
      props.basketTable
    );
    let getBasketOfUserLambda = this.createLambda(
      this,
      "getBasketOfUserLambdaHandler",
      "getBasketOfUser.ts",
      props.basketTable
    );
    let prepareOrderLambda = this.createLambda(
      this,
      "prepareOrderLambdaHandler",
      "prepareOrder.ts",
      props.basketTable
    );

    let checkoutPublishEventLambda = this.createLambda(
      this,
      "checkoutPublishEventLambdaHandler",
      "checkoutPublishEvent.ts",
      props.basketTable,
      props.ecomAuctionEventBus
    );

    let removeTotalPriceLambda = this.createLambda(
      this,
      "removeTotalPriceLambdaHandler",
      "removeTotalPrice.ts",
      props.basketTable
    );

    let deleteBasketLambda = this.createLambda(
      this,
      "deleteBasketLambdaHandler",
      "deleteBasket.ts",
      props.basketTable
    );

    /**
     * Saga Pattern StepFunction
     * 1) Reserve Flight
     * 2) Reserve Car Rental
     * 2) Take Payment
     * 3) Confirm Flight and Car Rental reservation
     */

    // final states - success or failure
    const checkoutFailed = new Fail(this, "Checkout Failed", {
      error: "Job Failed",
    });
    const checkoutSucceeded = new Succeed(this, "Checkout Successful!");

    // Step Functions Tasks to publish messages to SNS topic
    const snsNotificationFailure = new SnsPublish(this, "SendingSMSFailure", {
      topic: props.checkoutTopic,
      integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
      message: TaskInput.fromText("Your Checkout failed"),
    });

    const snsNotificationSuccess = new SnsPublish(this, "SendingSMSSuccess", {
      topic: props.checkoutTopic,
      integrationPattern: IntegrationPattern.REQUEST_RESPONSE,
      message: TaskInput.fromText("Your Checkout is Successful"),
    });

    // Pass states
    const validationFailedState = new Pass(this, "ValidationFailed");
    const gettingBasketFailed = new Pass(this, "gettingBasketFailed");
    const checkoutPublishEventFailed = new Pass(
      this,
      "checkoutPublishEventFailed"
    );
    const deleteBasketError = new Pass(this, "deleteBasketError");

    // state tasks
    const handlePrepareOrderFailure = new Parallel(
      this,
      "handlePrepareOrderFailure"
    );

    const removeTotalPriceStep = new LambdaInvoke(this, "RemoveTotalPrice", {
      lambdaFunction: removeTotalPriceLambda,
      resultPath: "$.RemoveTotalPriceFunctionResult",
    }).addRetry({ maxAttempts: 3 }); // retry this task a max of 3 times if it fails

    handlePrepareOrderFailure.branch(removeTotalPriceStep);
    handlePrepareOrderFailure.branch(snsNotificationFailure);
    handlePrepareOrderFailure.next(checkoutFailed);

    // LambdaInvoke = Invoke a Lambda function as a Task.
    const validationCheckStep = new LambdaInvoke(this, "ValidationCheck", {
      lambdaFunction: validationCheckLambda,
      resultPath: "$.validationCheckFunctionResult", // where in the state machine data the step result should be inserted
    }).addCatch(validationFailedState, {
      resultPath: "$.validationCheckFunctionResult",
    });

    const getBasketOfUservalidationCheckStep = new LambdaInvoke(
      this,
      "GetBasketOfUser",
      {
        lambdaFunction: getBasketOfUserLambda,
        resultPath: "$.resultGetBasketOfUserFunctionResult", // where in the state machine data the step result should be inserted
      }
    )
      .addRetry({ maxAttempts: 2 })
      .addCatch(gettingBasketFailed, {
        resultPath: "$.resultGetBasketOfUserFunctionResult",
      });

    const checkoutPublishEventLambdaStep = new LambdaInvoke(
      this,
      "CheckoutPublishEvent",
      {
        lambdaFunction: checkoutPublishEventLambda,
        resultPath: "$.checkoutPublishEventFunctionResult", // where in the state machine data the step result should be inserted
      }
    ).addCatch(checkoutPublishEventFailed, {
      // resultPath: "$.checkoutPublishEventFunctionResult",
      resultPath: undefined, // disrregard result directly copy input state to output
    });

    const checkOrderIsLessThanLimit = new Choice(
      this,
      "Is order less than $10000?"
    )
      .when(
        Condition.numberGreaterThan(
          "$.resultPrepareOrderFunctionResult.Payload.newBasket.totalPrice", // Look at the "status" field
          10000
        ),
        checkoutFailed
      )
      .when(
        Condition.numberLessThan(
          "$.resultPrepareOrderFunctionResult.Payload.newBasket.totalPrice",
          10000
        ),
        checkoutPublishEventLambdaStep
      )
      .otherwise(checkoutFailed)
      .afterwards();
    // when 0 totalPrice // If none of the given conditions match, continue execution with the given state.

    const prepareOrderLambdaStep = new LambdaInvoke(this, "PrepareOrder", {
      lambdaFunction: prepareOrderLambda,
      resultPath: "$.resultPrepareOrderFunctionResult", // where in the state machine data the step result should be inserted
    }).addCatch(handlePrepareOrderFailure, {
      resultPath: "$.resultPrepareOrderFunctionResult",
    });

    const deleteBasketStep = new LambdaInvoke(this, "deleteBasket", {
      lambdaFunction: deleteBasketLambda,
      resultPath: "$.deleteBasketStepFunctionResult",
    }).addCatch(deleteBasketError, {
      // resultPath: "$.checkoutPublishEventFunctionResult",
      resultPath: undefined, // disrregard result directly copy input state to output
    });

    //Step function definition
    const definition = Chain.start(validationCheckStep)
      .next(getBasketOfUservalidationCheckStep)
      .next(prepareOrderLambdaStep)
      .next(checkOrderIsLessThanLimit)
      .next(deleteBasketStep)
      .next(snsNotificationSuccess) // pass so much data like HttpStatusCode etc
      .next(checkoutSucceeded);

    const expressLogGroup = new LogGroup(this, "ExpressLogs", {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    let saga = new StateMachine(this, "StateMachine", {
      definition,
      stateMachineName: "CheckoutStateMachine",
      stateMachineType: StateMachineType.EXPRESS,
      timeout: Duration.seconds(10),
      // create this log group when you use express worflow, in standard its done by default
      logs: {
        destination: expressLogGroup,
        level: LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    this.CheckoutMachineArn = saga.stateMachineArn;
    return saga;
  }
}

/**
 * There are 2 methods to start state machines
 * 1) AWS Lambda resource to connect to our API Gateway to kickoff our step function
 * 2) direct API Gateway integration with Statemachine
 *
 * I have used 2 method for this state machine
 */

// const sagaLambda = new NodejsFunction(this, "sagaLambdaHandler", {
//   runtime: Runtime.NODEJS_18_X,
//   entry: join(
//     __dirname,
//     `./../src/basket-service/stateMachines/sagaLambda.ts`
//   ),
//   bundling: {
//     externalModules: ["@aws-sdk/*"], // Use the 'aws-sdk' available in the Lambda runtime
//   },
//   environment: {
//     statemachine_arn: saga.stateMachineArn,
//   },
// });

// Grant permission to the IAM role to start an execution of the Step Function
// saga.grantStartExecution(sagaLambda);

/**
 * Simple API Gateway proxy integration
 */
// new LambdaRestApi(this, "ServerlessSagaPattern", {
//   handler: sagaLambda,
//   endpointTypes: [EndpointType.REGIONAL],
// });
