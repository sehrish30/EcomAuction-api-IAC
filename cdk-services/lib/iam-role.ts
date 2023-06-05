import {
  Policy,
  PolicyStatement,
  Effect,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface IEcomAuctionIAMRoleProps {
  checkoutStateMachineArn: string;
}

export class EcomAuctionIAMRole extends Construct {
  public readonly stateMachineIamExecutionRole: Role;

  constructor(scope: Construct, id: string, props: IEcomAuctionIAMRoleProps) {
    super(scope, id);
    this.stateMachineIamExecutionRole = this.createStepFunctionIAMExecutionRole(
      props.checkoutStateMachineArn
    );
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
