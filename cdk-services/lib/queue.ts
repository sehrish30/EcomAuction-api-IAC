import { Duration } from "aws-cdk-lib";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { IQueue, Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";

interface EcomAuctionProps {
  consumer: IFunction;
}

export class EcomAuctionQueue extends Construct {
  // this will be a target queue of event bridge thats why we will make it public property
  public readonly orderQueue: IQueue;

  constructor(scope: Construct, id: string, props: EcomAuctionProps) {
    super(scope, id);

    // Send things to me if you don't know what to do with it.
    const deadLetterQueue = new Queue(this, "eventSequencingDLQueue", {
      queueName: "OrderQueueDLQ",
      deliveryDelay: Duration.millis(0),
      retentionPeriod: Duration.days(14), // default 4 days
    });

    // it requires to connect with Ordering micorservice
    // for event source mapping polling queues
    this.orderQueue = new Queue(this, "OrderQueue", {
      queueName: "OrderQueue",
      visibilityTimeout: Duration.seconds(30), // 6*3 also default
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: deadLetterQueue,
      },
      retentionPeriod: Duration.seconds(300), // 5 minutes
    });

    // sqs polling checkout basket event with the event source mappings for all the microservices
    // event source mapping invocation type
    // like i had asyncrhnous, synchronous invocation type
    // event source mapping function get required permission
    props.consumer.addEventSource(
      new SqsEventSource(this.orderQueue, {
        batchSize: 1, // no of records lambda function receives
      })
    );
  }
}
