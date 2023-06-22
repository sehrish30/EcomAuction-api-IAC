import {
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcomAuctionIAMRoleProps {}

export class EcomAuctionIAMRole extends Construct {
  public readonly appsyncLambdaRole: Role;
  public readonly dynamoDBRole: Role;

  constructor(scope: Construct, id: string, props: EcomAuctionIAMRoleProps) {
    super(scope, id);

    const appsyncLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
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
