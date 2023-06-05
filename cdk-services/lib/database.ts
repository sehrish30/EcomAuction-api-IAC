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
  public readonly basketTable: ITable;
  public readonly orderTable: ITable;


  constructor(scope: Construct, id: string) {
    super(scope, id);
    // reach productTable from this class publicly
    this.productTable = this.createProductTable();
    this.basketTable = this.createBasketTable();
    this.orderTable = this.createOrderTable();
  }
  private createProductTable(): ITable {
    // dynamodb tables, Table is construct to create dynamodb table
    const productTable = new Table(this, "product", {
      // product: PK: id --name - description - imageFile - price - category
      partitionKey: { name: "id", type: AttributeType.STRING },
      tableName: "product",
      // remove when cdk destroy else cdk wont remove it if it has items
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    return productTable;
  }

  private createBasketTable(): ITable {
    // basket: PK: userName --items (-quantity, color, price, productId, productName)
    const basketTable = new Table(this, "basket", {
      tableName: "basket",
      partitionKey: {
        name: "userName",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    return basketTable;
  }

  // order: PK: userName, SK: orderDate
  // --totalPrice -firstName -lastName
  private createOrderTable(): ITable {
    // basket: PK: userName --items (-quantity, color, price, productId, productName)
    const orderTable = new Table(this, "order", {
      tableName: "order",
      partitionKey: {
        name: "userName",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "orderDate",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    return orderTable;
  }
}
