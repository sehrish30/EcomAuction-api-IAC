import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcomAuctionCloudWatchProps {}

export class EcomAuctionCloudWatch extends Construct {
  public readonly cloudWatchRole: Role;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.cloudWatchRole = this.createCloudWatchRole();
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
}
