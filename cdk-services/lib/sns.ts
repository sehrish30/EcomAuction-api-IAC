import { ITopic, Topic } from "aws-cdk-lib/aws-sns";
import {
  SmsSubscription,
  EmailSubscription,
} from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

interface EcomAuctionProps {
  adminPhone: string;
  adminsEmailParam: string;
}

export class EcomAuctionSNS extends Construct {
  public readonly checkoutTopic: ITopic;

  constructor(scope: Construct, id: string, props: EcomAuctionProps) {
    super(scope, id);
    this.checkoutTopic = this.createCheckoutTopic(
      props.adminPhone,
      props.adminsEmailParam
    );
  }
  private createCheckoutTopic(
    adminPhone: string,
    adminsEmailParam: string
  ): ITopic {
    // SNS Topic, Subscription configuration
    const checkoutTopic = new Topic(this, "CheckoutTopic");

    // subscription to user admin
    checkoutTopic.addSubscription(new SmsSubscription(adminPhone));
    checkoutTopic.addSubscription(new EmailSubscription(adminsEmailParam));
    return checkoutTopic;
  }
}
