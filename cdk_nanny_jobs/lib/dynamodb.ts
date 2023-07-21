import { Construct } from "constructs";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

interface EcomAuctionDynamoDBProps {}

export class EcomAuctionDynamoDB extends Construct {
  public readonly babySitterTable: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    /**
     * Database
     */
    this.babySitterTable = new Table(this, "babySitterTable", {
      tableName: "babySitterTable",
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY,
      //   deletionProtection: true, // when u dont want to lose ur dynamodb data
    });

    this.babySitterTable.addGlobalSecondaryIndex({
      indexName: "jobApplications",
      partitionKey: {
        name: "GSI1PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI1SK",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    this.babySitterTable.addGlobalSecondaryIndex({
      indexName: "jobsAppliedTo",
      partitionKey: {
        name: "GSI2PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI2SK",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    this.babySitterTable.addGlobalSecondaryIndex({
      indexName: "getJobsByStatus",
      partitionKey: {
        name: "jobStatus",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
