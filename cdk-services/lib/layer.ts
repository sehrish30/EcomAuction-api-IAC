import {
  Architecture,
  Code,
  LayerVersion,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";

interface EcomAuctionApiGatewayProps {}

export class EcomAuctionApiLayer extends Construct {
  public readonly loggerLayer: LayerVersion;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.loggerLayer = this.loggingLayer();
    // this.thirdPartyLayer();
  }

  private loggingLayer(): LayerVersion {
    return new LayerVersion(this, "loggin-layer", {
      compatibleRuntimes: [Runtime.NODEJS_18_X, Runtime.NODEJS_16_X],
      code: Code.fromAsset(join(__dirname, "./../src/layer-service/logging")), // The content of this Layer.
      description: "logs thorogh data for users",
      layerVersionName: "loggingLayer",
      compatibleArchitectures: [Architecture.X86_64], // default value
    });
  }

  private thirdPartyLayer() {
    const yupLayer = new LayerVersion(this, "yup-layer", {
      compatibleRuntimes: [Runtime.NODEJS_18_X, Runtime.NODEJS_16_X],
      code: Code.fromAsset(join(__dirname, "./../src/layer-service/yup")),
      description: "Uses a 3rd party library called yup",
    });
  }
}
