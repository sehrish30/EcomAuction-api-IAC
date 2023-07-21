import { UserPool } from "aws-cdk-lib/aws-cognito";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcomAuctionCognitoProps {
  userPool: UserPool;
}

export class EcomAuctionCognito extends Construct {
  public readonly cognitoPolicy: PolicyStatement;
  constructor(scope: Construct, id: string, props: EcomAuctionCognitoProps) {
    super(scope, id);

    // policy to create and remove user from cognito userpool
    this.cognitoPolicy = new PolicyStatement({
      actions: [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminAddUserToGroup",
      ],
      resources: [props.userPool.userPoolArn],
    });
  }
}
