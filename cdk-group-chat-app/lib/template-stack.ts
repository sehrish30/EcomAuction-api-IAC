import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

interface EcomAuctionTemplateStackProps extends StackProps {}

export class EcomAuctionTemplateStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: EcomAuctionTemplateStackProps
  ) {
    super(scope, id, props);
  }
}
