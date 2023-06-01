import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcomAuctionDatabase } from "./database";
import { EcomAuctionServices } from "./microservices";
import { EcomAuctionApiGateway } from "./apigateway";
import { EcomAuctionEventBus } from "./eventbus";

export class CdkServicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * All constructs besides root construct
     * must be created within the scope of another construct
     * encapulate infrastructure resources, as per resource type
     * Creating all custom constructs
     */

    const database = new EcomAuctionDatabase(this, "Database");

    const microservices = new EcomAuctionServices(this, "Microservices", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable,
    });

    const apigateway = new EcomAuctionApiGateway(this, "ApiGateway", {
      productMicroService: microservices.productMicroservice,
      basketMicroService: microservices.basketMicroservice,
      orderMicroService: microservices.orderMicroservice,
    });

    const eventBus = new EcomAuctionEventBus(this, "EventBus", {
      publisherFunction: microservices.basketMicroservice,
      targetFunction: microservices.orderMicroservice,
    });
  }
}

// https://github.com/aws/aws-cdk/tree/v1-main/packages/@aws-cdk

/**
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
