import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction, SqsQueue } from "aws-cdk-lib/aws-events-targets";
import { IQueue } from "aws-cdk-lib/aws-sqs";

interface EcomAuctionEventBusProps {
  publisherFunction: IFunction; // basket microservice
  // targetFunction: IFunction; // SQS queue to order microservice
  targetQueue: IQueue;
}

export class EcomAuctionEventBus extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionEventBusProps) {
    super(scope, id);

    // event bus
    const bus = new EventBus(this, "EcomAuctionEventBus", {
      eventBusName: "EcomAuctionEventBus",
    });

    const checkoutBasketRule = new Rule(this, "CheckoutBasketRule", {
      eventBus: bus,
      enabled: true,
      description: "When basket service checkout the basket",
      eventPattern: {
        // these eventPatterns are matched
        source: ["com.ecomAuction.basket.checkoutbasket"],
        detailType: ["CheckoutBasket"],
      },
      ruleName: "CheckoutBasketRule",
    });

    // target function only to be consumed if event comes from this source and detailType
    // checkoutBasketRule.addTarget(new LambdaFunction(props.targetFunction));
    checkoutBasketRule.addTarget(new SqsQueue(props.targetQueue));

    // grant permissions to publisher function to push events to custom event bus
    bus.grantPutEventsTo(props.publisherFunction);
  }
}

// aws events put-events --entries file://checkoutBasketEvents.json
// {
//     "FailedEntryCount": 0,
//     "Entries": [
//         {
//             "EventId": "521ae2ef-ad34-83d2-e126-b263c876a692"
//         }
//     ]
// }
