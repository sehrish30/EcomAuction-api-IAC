import {
  Policy,
  PolicyStatement,
  Effect,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface IEcomAuctionIAMRoleProps {
  checkoutStateMachineArn: string;
  productMicroservice: IFunction;
}

export class EcomAuctionIAMRole extends Construct {
  public readonly stateMachineIamExecutionRole: Role;

  constructor(scope: Construct, id: string, props: IEcomAuctionIAMRoleProps) {
    super(scope, id);
    this.stateMachineIamExecutionRole = this.createStepFunctionIAMExecutionRole(
      props.checkoutStateMachineArn
    );
    this.awsXRAYIAMRole(props.productMicroservice);
  }

  private awsXRAYIAMRole(checkProductLambdaWorker: IFunction) {
    const xrayWriteAccess = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
      resources: [checkProductLambdaWorker.functionArn],
    });

    const role = new Role(this, "XRayLambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    role.addToPolicy(xrayWriteAccess);
  }

  private createStepFunctionIAMExecutionRole(stateMachineArn: string) {
    const policy = new Policy(this, "getPolicy", {
      statements: [
        new PolicyStatement({
          actions: ["states:StartExecution"],
          effect: Effect.ALLOW,
          resources: [stateMachineArn],
        }),
      ],
    });

    // role assumed by aws service api gateway
    return new Role(this, "getRole", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
  }
}
