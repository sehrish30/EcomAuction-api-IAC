import { RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface EcomAuctionDynamoDBProps {}

export class EcomAuctionDynamoDB extends Construct {
  public readonly groupChatTable: Table;
  constructor(scope: Construct, id: string, props: EcomAuctionDynamoDBProps) {
    super(scope, id);
    /**
     * Database
     */
    this.groupChatTable = new Table(this, "groupChatDynamoDbTable", {
      tableName: "groupChatDynamoDBTable",
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

    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "groupsCreatedByUser",
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

    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "getMessagesPerGroup",
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

    this.groupChatTable.addGlobalSecondaryIndex({
      indexName: "groupsUserBelongTo",
      partitionKey: {
        name: "GSI3PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "GSI3SK",
        type: AttributeType.STRING,
      },

      projectionType: ProjectionType.ALL,
    });
  }
}
