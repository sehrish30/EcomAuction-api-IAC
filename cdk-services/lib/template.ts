import { Construct } from "constructs";

interface EcomAuctionApiGatewayProps {}

export class EcomAuctionApiLayer extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionApiGatewayProps) {
    super(scope, id);
  }
}
