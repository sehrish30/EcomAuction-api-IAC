// EcomAuction is company name
// Contructs: Basic building blocks of AWS CDK apps. A construct represents a "cloud environment"

import { RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ITable,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class EcomAuctionDatabase extends Construct {
  // public member to access this outside of the class

  public readonly productTable: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    // dynamodb tables, Table is construct to create dynamodb table
    const productTable = new Table(this, "product", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      tableName: "product",
      // remove when cdk destroy else cdk wont remove it if it has items
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    // reach productTable from this class publicly
    this.productTable = productTable;
  }
}
