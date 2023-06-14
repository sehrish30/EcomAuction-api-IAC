import { Port, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcomAuctionApiGatewayProps {
  redisSecurityGroup: SecurityGroup;
  elastiCachevpc: Vpc;
}

export class EcomAuctionIAMRoleElasticCache extends Construct {
  public readonly elasticCachelambdaSG: SecurityGroup;

  constructor(scope: Construct, id: string, props: EcomAuctionApiGatewayProps) {
    super(scope, id);
    this.elasticCachelambdaSG = this.createRoleForLambdaToAccessElasticCache(
      props.elastiCachevpc,
      props.redisSecurityGroup
    );
  }
  private createRoleForLambdaToAccessElasticCache(
    vpc: Vpc,
    redisSecurityGroup: SecurityGroup
  ): SecurityGroup {
    // create a new iam role
    const lambdaRole = new Role(this, `lambdaRole`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    // attach managed role with role
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonElastiCacheFullAccess")
    );

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaENIManagementAccess"
      )
    );

    // create security group associated with VPC in which the ElastiCache Redis cluster is running
    const lambdaSG = new SecurityGroup(this, `ambdaSG`, {
      vpc: vpc,
      allowAllOutbound: true, // allows all outbound network traffic from the Lambda function to any destination
      securityGroupName: "redis-lambdaFn Security Group",
    });

    // allowTo method is used to allow inbound network traffic from the Redis cluster's security group
    // allows the Lambda function to connect to the Redis cluster and perform Redis operations.
    lambdaSG.connections.allowTo(
      redisSecurityGroup,
      Port.tcp(6379),
      "Allow this lambda function connect to the redis cache"
    );
    return lambdaSG;
  }
}
