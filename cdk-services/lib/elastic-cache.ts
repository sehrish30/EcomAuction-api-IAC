import { Construct } from "constructs";
import {
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { CfnCacheCluster, CfnSubnetGroup } from "aws-cdk-lib/aws-elasticache";

interface EcomAuctionApiGatewayProps {}

export class EcomAuctionElasticCache extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /**
     * Create the VPC where the Elasticache Redis cluster will be deployed
     * Redis instance must be in vpc
     */
    const vpc = new Vpc(this, "EcomAuctionVpc", {
      maxAzs: 2, // maximum number of AZs to use in this region
      //   subnetConfiguration: [
      //     {
      //       cidrMask: 24,
      //       name: "public1",
      //       subnetType: SubnetType.PUBLIC,
      //     },
      //     {
      //       cidrMask: 24,
      //       name: "isolated1",
      //       subnetType: SubnetType.PRIVATE_ISOLATED,
      //     },
      //   ],
    });

    /**
     *  Create the security group for the Elasticache Redis cluster
        what traffic comes in and out of redis vpc instance
       security group operate at the instance level
        Seceutiy groups are stateful
        can have only allow rules
        if no rule is defined that traffic is blocked
        setting up a security group and adding the IP address of your Node.js application to the security group.
     */
    const securityGroup = new SecurityGroup(this, "EcomAuctionSecurityGroup", {
      vpc,
      securityGroupName: "my-cache-security-group",
      description: "Security group for my Elasticache cluster",
      allowAllOutbound: true,
    });

    // Add ingress rules to the security group
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(6379),
      "Allow Redis traffic from anywhere"
    );

    // create a single Redis (no replication) Cluster using typescript
    const subnetGroup = new CfnSubnetGroup(
      this,
      "RedisClusterPrivateSubnetGroup",
      {
        subnetIds: vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }).subnetIds, // The EC2 subnet IDs for the cache subnet group.
        description: "Subnets for Elasticache Redis",
        // subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
        cacheSubnetGroupName: "Ecomauction",
      }
    );

    // Create the Elasticache Redis cluster
    const redis = new CfnCacheCluster(this, `RedisCluster`, {
      engine: "redis",
      cacheNodeType: "cache.t2.micro",
      numCacheNodes: 1,
      clusterName: "ecom-auction-api-redis-cluster",
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName, // The name of the subnet group.
    });
    redis.addDependency(subnetGroup);
  }
}
