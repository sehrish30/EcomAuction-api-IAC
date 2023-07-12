import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcomApartmentCloudWatchProps {}

export class EcomApartmentCloudWatch extends Construct {
  public readonly cloudWatchRole: Role;
  public readonly appsyncLambdaRole: Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.cloudWatchRole = this.createCloudWatchRole();
    this.appsyncLambdaRole = this.createAppsyncLambdaRole();
  }

  private createCloudWatchRole() {
    // give appsync permission to log to cloudwatch by assigning a role
    const cloudWatchRole = new Role(this, "appSyncCloudWatchLogs", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
    });

    cloudWatchRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppSyncPushToCloudWatchLogs"
      )
    );
    return cloudWatchRole;
  }

  private createAppsyncLambdaRole() {
    // file to allow appsync access Lambda
    const appsyncLambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("appsync.amazonaws.com"),
      roleName: "appsyncAllow",
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaSQSQueueExecutionRole"
        ),
      ],
    });

    return appsyncLambdaRole;
  }
}
