import { PhysicalName } from "aws-cdk-lib";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcomAuctionIAMRoleProps {}

export class EcomAuctionIAMRole extends Construct {
  public readonly appsyncLambdaRole: Role;
  public readonly dynamoDBRole: Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // rile to allow appsync access dynamodb
    const appsyncLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
      roleName:  "appsyncAllow",
    });
    appsyncLambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess")
    );

    this.appsyncLambdaRole = appsyncLambdaRole;

    const dynamoDBRole = new Role(this, "DynamoDBRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });

    dynamoDBRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    this.dynamoDBRole = dynamoDBRole;
  }
}
