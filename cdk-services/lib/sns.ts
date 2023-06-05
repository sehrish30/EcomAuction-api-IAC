import { ITopic, Topic } from "aws-cdk-lib/aws-sns";
import { SmsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export class EcomAuctionSNS extends Construct {
  public readonly checkoutTopic: ITopic;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // SNS Topic, Subscription configuration
    const checkoutTopic = new Topic(this, "CheckoutTopic");

    // subscription to user admin
    checkoutTopic.addSubscription(new SmsSubscription("+9999"));

    this.checkoutTopic = checkoutTopic;
  }
}
