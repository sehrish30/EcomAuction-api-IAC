import { Construct } from "constructs";
import {
  CfnEIP,
  CfnNatGateway,
  CfnRoute,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
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
  public natGateway: CfnNatGateway;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    /**
     * Create the VPC where the Elasticache Redis cluster will be deployed
     * Redis instance must be in vpc
     * also lambda function that needs to communicate with that redis cluster
     * subnet is always in availability zone
     * security group is a firewall that controls what traffic goes into the instance
     * and what goes out of instance, they are stateful if allowed traffic from certain port automatically allow traffic
     * to go out from that port
     */
    const vpc = new Vpc(this, "EcomAuctionVpc", {
      maxAzs: 1, // maximum number of AZs to use in this region
      // cidr: "10.0.0.0/20", // Vpc ip address range cannot change it after created it
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

    // // Allocate a new Elastic IP address
    // public ip that we assign to internet gateway
    // const eip = new CfnEIP(this, "AuctionEip");

    // // Create a NAT gateway in a first public subnet
    // // NAT Gateway is used to allow resources in private subnets to access the internet
    // const natGateway = new CfnNatGateway(this, "NatGateway", {
    //   subnetId: vpc.publicSubnets[0].subnetId,
    //   allocationId: eip.attrAllocationId,
    // });

    // this.natGateway = natGateway;
    // // natGateway.attrNatGatewayId

    // // Add a default route to the private subnets to use the NAT gateway as the router
    // create a route to nat gateway in private subnets
    // vpc.privateSubnets.forEach((subnet) => {
    //   // iterates through all private subnets in the VPC and creates a new CfnRoute resource for each subnet
    //   new CfnRoute(this, `RouteToInternetViaNatGateway-${subnet.node.id}`, {
    //     routeTableId: subnet.routeTable.routeTableId, // ID of the subnet's route table
    //     destinationCidrBlock: "0.0.0.0/0",
    //     natGatewayId: natGateway.ref, // ID of the nat gateway
    //   });
    // });

    // Create a VPC endpoint for DynamoDB
    const endpoint = vpc.addGatewayEndpoint("DynamoDBEndpoint", {
      service: GatewayVpcEndpointAwsService.DYNAMODB,
    });
    // causing requests within the public subnet destined for Kinesis to go through the Interface Endpoint
    const kinesisInterfaceEndpoint = vpc.addInterfaceEndpoint(
      "kinesis-endpoint",
      {
        service: InterfaceVpcEndpointAwsService.KINESIS_STREAMS,
        privateDnsEnabled: true,
        subnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      }
    );

    this.vpc = vpc;

    /**
     *  Create the security group for the Elasticache Redis cluster
        what traffic comes in and out of redis vpc instance
       security group operate at the instance level
        Seceutiy groups are stateful
        can have only allow rules
        if no rule is defined that traffic is blocked
        setting up a security group and adding the IP address of your Node.js application to the security group.
        public subnet is the one that has internet gateway attached and route table has entry to internet gateway
        private subnet doesnot have internet gateway attached or no routing rule to internet gateway
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
          // subnetType: SubnetType.PRIVATE_ISOLATED,
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
      transitEncryptionEnabled: false,
    });

    // Indicates that this resource depends on another resource and cannot be provisioned unless the other resource has been successfully provisioned
    // This is to ensure that the subnetGroup is completed before the Redis cluster.
    redis.addDependency(subnetGroup);

    this.redisEndpoint = `redis://${redis.attrRedisEndpointAddress}:${redis.attrRedisEndpointPort}`;
  }
}
