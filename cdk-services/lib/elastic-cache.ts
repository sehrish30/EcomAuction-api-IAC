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
  public readonly redisEndpoint: string;
  public readonly vpc: Vpc;
  public readonly redisSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    /**
     * Create the VPC where the Elasticache Redis cluster will be deployed
     * Redis instance must be in vpc
     */
    const vpc = new Vpc(this, "EcomAuctionVpc", {
      maxAzs: 2, // maximum number of AZs to use in this region
      cidr: "10.32.0.0/24",
      natGateways: 1,
      subnetConfiguration: [
        {
          name: `PublicSubnet`,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: `PrivateSubnet`,
          subnetType: SubnetType.PRIVATE_ISOLATED, // only resources deployed in the VPC would be granted access to the network
        },
      ],
    });
    this.vpc = vpc;

    /**
     *  Create the security group for the Elasticache Redis cluster
        what traffic comes in and out of redis vpc instance
       security group operate at the instance level
        Seceutiy groups are stateful
        can have only allow rules
        if no rule is defined that traffic is blocked
        setting up a security group and adding the IP address of your Node.js application to the security group.
     */
    const redisSecurityGroup = new SecurityGroup(
      this,
      "EcomAuctionSecurityGroup",
      {
        vpc,
        securityGroupName: "my-cache-security-group",
        description: "Security group for my Elasticache cluster",
        allowAllOutbound: true,
      }
    );
    this.redisSecurityGroup = redisSecurityGroup;

    // Add ingress rules to the security group
    redisSecurityGroup.addIngressRule(
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
        // subnetIds: vpc.publicSubnets.map((ps) => ps.subnetId),
      }
    );

    // Create the Elasticache Redis cluster L1 construct
    const redis = new CfnCacheCluster(this, `RedisCluster`, {
      engine: "redis",
      cacheNodeType: "cache.t2.micro",
      numCacheNodes: 1,
      clusterName: "ecom-auction-api-redis-cluster",
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      // port: 6379, // port number on which each of the cache nodes accepts connections 6379 is default
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName, // The name of the subnet group.
      // logDeliveryConfigurations: [
      //   {
      //     destinationDetails: {
      //       cloudWatchLogsDetails: {
      //         logGroup: "logGroup",
      //       },
      //     },
      //     destinationType: "cloudwatch-logs",
      //     logFormat: "json",
      //     logType: "slow-log",
      //   },
      // ],
      transitEncryptionEnabled: false,
    });
    // clientSecretValue
    // Indicates that this resource depends on another resource and cannot be provisioned unless the other resource has been successfully provisioned
    // This is to ensure that the subnetGroup is completed before the Redis cluster.
    redis.addDependency(subnetGroup);

    this.redisEndpoint = `redis://${redis.attrRedisEndpointAddress}:${redis.attrRedisEndpointPort}`;
  }
}
