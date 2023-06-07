import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcomAuctionDatabase } from "./database";
import { EcomAuctionServices } from "./microservices";
import { EcomAuctionApiGateway } from "./apigateway";
import { EcomAuctionEventBus } from "./eventbus";
import { EcomAuctionQueue } from "./queue";
import { EcomAuctionStateMachine } from "./stateMachines";
import { EcomAuctionSNS } from "./sns";
import { EcomAuctionIAMRole } from "./iam-role";
import { EcomAuctionCloudformationParameters } from "./cloudformation-parameters";
import { EcomAuctionApiLayer } from "./layer";
import { EcomAuctionApiCognito } from "./cognito";
import { EcomAuctionApiGatewayAuthorizer } from "./apigateway-authorizer";

export class CdkServicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * All constructs besides root construct
     * must be created within the scope of another construct
     * encapulate infrastructure resources, as per resource type
     * Creating all custom constructs
     */

    const cdkParams = new EcomAuctionCloudformationParameters(
      this,
      "CloudformationParams"
    );

    const layers = new EcomAuctionApiLayer(this, "LayerVersion");

    const cognito = new EcomAuctionApiCognito(this, "Cognito");

    const database = new EcomAuctionDatabase(this, "Database");

    const microservices = new EcomAuctionServices(this, "Microservices", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable,
    });

    const queue = new EcomAuctionQueue(this, "Queue", {
      // sqs requires consumer that pulls events from sqs
      consumer: microservices.orderMicroservice,
      checkProductLambdaWorker: microservices.checkProductLambdaWorker,
    });

    const eventBus = new EcomAuctionEventBus(this, "EventBus", {
      publisherFunction: microservices.basketMicroservice,
      // targetFunction: microservices.orderMicroservice,
      targetQueue: queue.orderQueue,
    });

    const snsTopics = new EcomAuctionSNS(this, "snsTopics", {
      adminPhone: cdkParams.adminsPhoneParam,
      adminsEmailParam: cdkParams.adminsEmailParam,
    });

    const stateMachine = new EcomAuctionStateMachine(this, "StateMachine", {
      basketTable: database.basketTable,
      ecomAuctionEventBus: eventBus.ecomAuctionEventBus,
      checkoutTopic: snsTopics.checkoutTopic,
      productTable: database.productTable,
      checkQuantityProductsQueue: queue.checkQuantityProductsQueue,
      checkProductLambdaWorker: microservices.checkProductLambdaWorker,
    });

    const iamRole = new EcomAuctionIAMRole(this, "iamRole", {
      checkoutStateMachineArn: stateMachine.CheckoutMachineArn,
      productMicroservice: microservices.productMicroservice,
    });

    const authorizer = new EcomAuctionApiGatewayAuthorizer(this, "authorizer", {
      UserPool: cognito.userPool,
      UserPoolClientId: cognito.UserPoolClientId,
    });

    const apigateway = new EcomAuctionApiGateway(this, "ApiGateway", {
      productMicroService: microservices.productMicroservice,
      basketMicroService: microservices.basketMicroservice,
      orderMicroService: microservices.orderMicroservice,
      checkoutStateMachine: stateMachine.CheckoutStateMachine,
      stateMachineIamExecutionRole: iamRole.stateMachineIamExecutionRole,
      checkProductQuantitySagaLambda:
        stateMachine.checkProductQuantitySagaLambda,
      cognitoAuthorizer: authorizer.cognitoAuthorizer,
      customCognitoAuthorizer: authorizer.customCognitoAuthorizer,
    });
  }
}

// https://github.com/aws/aws-cdk/tree/v1-main/packages/@aws-cdk

/**
 *
 * cdk synth
 * cdk diff
 * cdk deploy
 *
 * Apps: Include everything needed to deploy your app to cloud environment
 * Stack: Unit of deployment in AWS cdk is called a stack
 * Contructs: Basic building blocks of AWS CDK apps. A construct represents a "cloud environment"
 * Environments: Each stack instance in your AWS Cdk app is explicitly or implicitly associated with an environment
 */

/**
 * Events are targetting to multiple aws resources
 * EventBridge sceham registry stores a collection of easy to find event schemas
 * No servers to provision, or manage, automatically scales based on number of events
 *
 * Event source: that publishes event to event bus
 * Event bus: All events coming to eventbridge are in event bus
 * Rules: match events to targets based on either the structure of the event, or event pattern, or scheduled patterns that triggers the target
 * Targets: Filtering through rules to filter events and if matched route event to target which is AWS service
 *
 * Eventbridge rules are event patterns or scheduler
 * event pattern defines event structure and fields that rule match
 * or a rule that is scheduled and perform an action at regular intervals
 * event-source mapping, event pattern mapping, source or detail-type
 *
 * Archives: events collection that have been published on event bus
 * replays: reprocess past events from archives, back into the event bridge
 *
 * You can have 5 targets for each rule
 */

/**
 * Topic queue Chaining:
 * Using sqs between Eventbridge and each of the subscriber services.
 * Queue acts as a buffer between the service to avoid loss of data if the service fails
 * Services can be down or getting exception or taken offline for maintenance, then events will be losses, disappeared and cannot process after the subscriber service is up and running.
 * Put SQS between EventBridge and Ordering service.
 * Store the event messages into SQS Queue with durable and persistent manner. No message will get lost.
 * Queue can act as a buffering load balancer.
 */

/**
 * In polling events , consumer poll the messages in batch from producer
 * SQS to decouple microservices, suppose if service is down when event is published
 * so in order to prevent message loss we should use queue because event bridge is send event and forget abt it
 *
 * Synchronous invocation
 * Asyncronous invocation
 * Event source mapping
 */

/**
 * Standard Queues: offer maximum throughput than FIFO, best effort ordering and at least once delivery, unlimited throughput, cheaper than FIFO
 * FIFO Queues: designed to guarantee that messages are processed and delivered exactly once, in the exact order that they are sent, limited to 300 messages per second per API action without batching and 3000 with batching
 *
 * Use Standard Queue if processing duplicates and out of order messages. Use FIFO when ordering of message is must and duplicates are not accepted at any cost
 *
 * SQS queues are dynamically created and scale automatcically
 * SQS locks your messages during processing, so multiple producers
 * can send and multiple consumers can receice messages at the same time
 * There is visibility timeout for both standard and FIFO
 * The number of inflight messages is limited to 20,000 in FIFO queue
 * A message is considered to be in flight after it is received from a queue by a consumer, but not yet deleted from the queue
 *
 * keep the number of messages with the same message group id low in FIFO queue
 * implement a dead-letter queue so that messages that fail processing are quickly moved out of the main queue
 *
 * SQS scales automatically with your application so you don't have to worry
 * about capacity planning and pre provisioning. There is no limit to the number of messages per queue,
 * and standard queues provide nearly unlimited throughput
 *
 * Security: SQS to exchange sensitive data between application using server side(SSE) to
 * encrypt each message body, keep sensitive data secure
 *
 * Visibility timeout:
 * Component 1 sends message A to the queue
 * Component 2 retrieves message A from the queue and the visibility timeout period starts
 * Component 2 processes Message and then deletes it from the queue during the visibility timeout period
 *
 * consumer must delete the message from the queue after receiving and processing it, else it stays in the queue
 *
 * Message Lifecycle:
 * When a consumer receives and processes a message from queue, the message remains in the queue
 * the consumer must delete the message from the queue after receiving and processing it
 * Visibility timeout, a period of time during which SQS prevents other consumers from processing the message
 * default visibility timeout for a message is 30s and min is 0s maximum 12hrs
 * if not deleted after visibility timeout another consumer will start processing it
 *
 * Short and Long polling:
 * Short polling, the ReceiveMessage request queries only a subset of the servers to find messages that are available to include in the response
 * Long polling: Receive message request queries all of the servers for messages. SQS sends a response after it collects at least one available message
 *
 * Consume messages using short polling, SQS sample a subset of it servers and returns messages from only those servers
 * When the wait time for ReceiveMessage API action is greater than 0, long polling is in effect.
 * Long polling helps reduce the cost of using SQS by eleminating the number of empty responses.
 * In some cases short polling is best practice else long polling is better
 * by default SQS uses short polling
 *
 * DLQ: Dead letter queue for messages that can't be processed
 * Example: User places an order of a product, but product is deleted. Since there is no product Id code fails and displays an error, and the message
 * with the order request is sent to dead letter queue
 * main task is ti handle lifecycle of unconsumed messages.
 * DLQ: lets you set aside and isolate messages that can't be processed correctly
 *
 * Setup DLQ:
 * Configure alarm for messages moved to DLQ
 * Examing logs for exceptions that might have caused messages to be moved to a DLQ
 * Analyze the contents of messages moved to DLQ
 * Determine wether you have given your consumer sufficient time to process messages
 */

/**
 * Lambda worker will poll the queue and invoke
 * our lambda function synchronously with an event that contains queue message
 * lambda is executed once for each batch and received a triggered event
 * sqs as event source of order microservice
 */

/**
 * Idempotency: Operation will return the same results whether it is called once or multiple times
 * Idempotency-Key: Assigned to the message by the sender to simplify deduplication by the receiver
 *
 * Store Idempotency-Key in external database
 * Client sends an event to something that can process the event
 * here in this case, its a lambda function
 * to lambda function
 * and that event includes idempotency key
 * Lambda will check external data store to see if that key exists
 * if it doesnot it processes the key, handles the event and stores the result to persistent store
 */

/**
 * Step functions:
 * Workflows you build with step functions are called state machines
 * and each step of your workflow is called a state
 *
 * When you execute your state machine, each move from one state
 * to the next is called state transition
 *
 * You can resuse components, easily edit the sequence of steps, or swap
 * out the code called by task states as your needs change
 *
 * declartive way of workflow using stack Language
 *
 * waitForTaskToken (Service integration pattern)
 * Queue work -> waitForTaskToken => queue => Tasktoken => Receiver
 * Receiver returns => SendTaskFailure => handler failure
 * Receiver returns =>  SendTaskSuccess => handler success
 *
 * loosely coupled chreography
 * tightly coupled orchestration
 * events vs workflows
 *
 * There can be nested express flow in standard workflow
 *
 * CallbackTaskToken pattern
 */

/**
 * Step functions:
 * You can use step function overflow for design
 *
 * Serverless function orchestrator
 * States:
 * Task State: unit of work, can have retries and catch
 * Wait state: state machine will be on hold until such time, can pause upto 1 year, for standard workflows not express
 * Parallel state: When you want to execute two things in parallel
 * Choice State: corresponds to if, then and else
 * Pass state: append new attrbiutes to your execution state
 * Succeed State: successfully complete state machine
 * Fail state: Fail state machine, specify the cause and error of fail state
 * Map state: array of inputs, according to set maxConcurrency if 0 will happen one after other, if 5 then all 5 will start together
 *
 * step functions can integaret with
 * external lambda functions
 * sqs, sns
 * ecs,
 * AWS batch
 * sagebaker
 * another step function
 *
 * State machines pattern:
 * 1) Request response => state machine doesnot worry about output of that work
 * 2) waitForTaskToken => e.g
 * SQS receives task token from step functions
 * backend process takes the message off the queue
 * backend process performs some work
 * the process responds back to step functions
 * will come back with tasktoken which it got from step functions
 * step function will receive the result and check the taskToken
 * and know which execution of the state machine goes with this taskToken
 * it will take the output
 * and send it as input to parse results state
 *
 * .syncommand, wait for a state to complete before progressing to next state
 *
 * Callback pattern: where you call third party service
 * e.g in one of the step we have to put message in sqs queue and wait till that message
 * is consumed by lambda
 * when scheduling a task in sqs queue, step function will send taskToken along with that message
 * so once message is being executed, it will use that task token to send the message back to state machine
 * whether it is successful or not. so it depends on the message if its success or failed
 * advantage is state machine or step function donot have to check the progress
 * once task is completed lambda will call back
 * highly scalable approach in event driven architecture
 *
 * Acitvity Pattern
 * create an activity -> think of it like a queue
 * Queue of tasks which can be pulled by some workers to do some actual work then
 * get an arn that points to that activity
 * when u define an activity resource task in your state machine you specify that arn
 * heartbeat and timeout for activity
 * after my worker comes to fetch a task to do via activity
 * it will send a heartbeat every specified heartbeat seconds to tell step functions that it is going to work
 * the work from the time acitvity tasks is fetched, to the time the worker comes back to say i'm done should be done within timeout duration
 * else perform work state acitvity is marked as failed
 * 1) first worker will make a getAcivityTask call to stepFunctions, specifying the arn of the activity
 * worker will keep doing infinitely, until there is task for that activity
 * respose from worker will have the input that was sent to this perform work task
 * as well as the task token that is unique to this activity task was received from this GetActivityTasks
 * while worker does that work it will need to make sure that it sends hearbeats within heartbeat time to step functions by specifying the task token that it was given at the first step
 * it will send back taskSuccess or taskFailure
 *
 * STANDARD vs EXPRESS:
 * For high volume, like IoT = EXPRESS
 * Execution start rate: Over 2000 per second | Over 100,000 per second
 * State transition rate: Over 4000 per second per account | unlimited
 * Persisted to disk | In memory only
 * Exactly-once workflow execution | At least once workflow execution
 * so if there is an issue with state: standard workflow only has to restart the state but EXPRESS has to restart the whole machine
 * because data is on dish in STANDARD workflow
 * that means that you need to make sure that entirety of your code behind step functions is idempotent when using EXPRESS worflow
 * STANDARD: priced per transition, limit 365 days
 * EXPRESS: Priced by the number of executions you run, their duration or length and memory consumption, limit: 5minutes
 *
 * STANDARD: Execution history is stored in step functions, and can be sent to cloudwatch logs
 * EXPRESS: Sent to AWS cloudwatch logs
 *
 * Both support All Service Integrations
 * But STANDARD support all patterns
 * But Express doesnot support all patterns, doesnot support job run(.sync) or callback pattern(.waitForTaskPattern)
 *
 *
 * CLOUDWATCH:
 * Execution Logging: What the traffic in and out of your API is.
 * Access Logging: What's within your api, what it found from the request after logging in, or tansforing the request
 * by specifying which peice of the context variable you want to log, not just the in and out like exection logging. But its only
 * supported in REST api
 *
 * API Gateway:
 * Edge endpoints: traffic goes from customer to edge location where cloudfront lives
 * endpoint url actually pointing to Cloudfront itself
 * which will then be pointing to your api in the region you selected
 * best endpoint for geographically distrbuted clients
 *
 * Regional endpoints: are for clients in the same region. It reduces connection overhead.
 * example: When a client  running on ec2 instance calls api in the same region
 *
 * Response caching turned on for stage level, so mostly for prod level cost reason
 * When caching is enabled choose cache capacity, greater cache capacity greater performance
 * but costs more
 * After u enale caching api gateway creates dedicated cache instance process takes a while to boost up.
 * If u increase cache capacity it will b rebooted and all existing cache will be deleted
 * By default only GET method is cached
 * method on integration params can be used as cache keys
 * 

 * Lambda@Edge feature of cloudfront to run api closer to user help to reduce latency and improve performance
 * Invocation types
 * Viewer request to cloudfront
 * Viewer request to origin
 * Origin response to Cloudfront
 * Origin response to Viewer
 * 
 * Lambda layers:
 * externally packages dependencies too share across multiple lambda functions
 * reduces lines of code from lambda
 * simplify dependency management
 * 
 * limitation:
 * 2 lambda layers per lambda function
 * total unzip size of function and all layers together cannot exceed unzipped package size limit of lambda that is 250MB
 * layers dont add add space to your lambda function, you are still limited to total size
 * name, description and zip archive of layer, list of runtimes compatible with layer, add layer permission
 * You choose specific version of the layer to use
 * At the time of runtime layer drops its code to /opt
 * 
 * Lambda best practices:
 * smallest package size possible when deploying lambda function
 * limit on lambda package size is 75MB
 * dont package entire aws sdk only include whats needed e.g s3 portion of sdk 
 * prefer small frameworks that load quickly under runtime
 * e.g if u use frameworks that does depency injection
 * the longer it takes for framework to manage those dependencies
 * longer it will take for lambda function to initialize
 * avoid recursive code in your lambda function
 * if recursive design is done mistakenly make sure
 * to set concurrent exection limit to 0
 * to throttle all invocations of the function
 * Execution context resuse: by intializing sdk clients
 * and database connections outside of the function handler
 * cache static assets in locally available storage for lambda function in /temp directory
 * Any subsequent invocations processed by the same instance of your function can reuse these resources
 * which will save execution time and cost
 * Donot user store data or sensitive data in execution context
 * Load test your lambda functions to determine optimal timeout value
 * 
 * Http apis are cheaper and faster
 * 1) Lambda proxy
 * 2) HTTP endpoint proxy
 * 3) OPENID Connect
 * 4) Oauth2 authorization
 * 5) CORS support
 * 6) Private integration support
 * If you want to use response and mappings and full control use REST api
 * If you are only using lambda proxy integration consider using http apis
 */

/**
 * Cognito
 * made of 2 services:
 * User pool
 * Federated identities or identity pool
 *
 * User pool is user directory also can be referred as identity provider
 * signin user with email and password, phone numberor MFA,
 * also an option for hosted user interface
 *
 * If you only need to communicate with API Gateway and want backend to
 * have more information about the user then integrating with API gateway
 * directly with user pool is a good idea
 *
 * If you need to communicate with any other AWS services directly then you will
 * need to use Federared Identities. Federate identities also provide unauthenticated
 * identity.
 * you can give an IAM role for anyone who doesnot have credentials to authenticate
 * This can be useful to provide anonymous access
 */
