import { Duration } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface EcomAuctionServicesProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}

// EcomAuction is company name
// props parameter, to communicate between 2 solution constructs

export class EcomAuctionServices extends Construct {
  public readonly productMicroservice: NodejsFunction;
  public readonly basketMicroservice: NodejsFunction;
  public readonly orderMicroservice: NodejsFunction;

  constructor(scope: Construct, id: string, props: EcomAuctionServicesProps) {
    super(scope, id);

    this.productMicroservice = this.createProductFunction(props.productTable);
    this.basketMicroservice = this.createBasketFunction(props.basketTable);
    this.orderMicroservice = this.createOrderFunction(props.orderTable);
  }
  private createProductFunction(productTable: ITable): NodejsFunction {
    /**
     * When bundling, performing with Nodejs
     * function, it is require to run docker daemon
     * in order to compress and perform some bonding operations
     * under Nodejs functions when deploying the application
     * compress libraries, create container and push to lambda function
     * so turn on docker desktop
     * and check "docker ps"
     * It will create a docker container for bundling our nodejs
     * lambda function and uploading these lambda functions to the CDK management stack
     * in order to manage our deployments
     */
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        // externalModules property is used to specify that the aws-sdk module should be excluded from the bundled package. This is because the aws-sdk is already provided by the Lambda execution environment,
        // so there's no need to include it in the function package.
        externalModules: ["aws-sdk/*"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: productTable.tableName, // get table name
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(3),
    };
    //  NodejsFunction construct as a lambda function
    // which automatically transpiles and bundles our code, regardless if it's written in JavaScript or TypeScript
    const productFunction = new NodejsFunction(this, "productLambdaFunction", {
      ...nodeJsFunctionProps,
      entry: join(__dirname, "./../src/product-service/index.ts"),
    });

    // give crud operations permission on product table
    productTable.grantReadWriteData(productFunction);
    return productFunction;
  }
  private createBasketFunction(basketTable: ITable): NodejsFunction {
    const basketFunctionProps: NodejsFunctionProps = {
      bundling: {
        // externalModules property is used to specify that the aws-sdk module should be excluded from the bundled package. This is because the aws-sdk is already provided by the Lambda execution environment,
        // so there's no need to include it in the function package.
        // A list of modules that should be considered as externals (already available in the runtime).
        externalModules: ["aws-sdk/*"],
      },
      environment: {
        PRIMARY_KEY: "username",
        DYNAMODB_TABLE_NAME: basketTable.tableName, // get table name,
        EVENT_DETAIL_TYPE: "CheckoutBasket",
        EVENT_BUSNAME: "EcomAuctionEventBus",
        EVENT_SOURCE: "com.ecomAuction.basket.checkoutbasket",
      },
      runtime: Runtime.NODEJS_18_X,
    };
    //  NodejsFunction construct as a lambda function
    // which automatically transpiles and bundles our code, regardless if it's written in JavaScript or TypeScript
    const backetFunction = new NodejsFunction(this, "basketLambdaFunction", {
      ...basketFunctionProps,
      entry: join(__dirname, "./../src/basket-service/index.ts"),
    });
    // give crud operations permission on product table
    basketTable.grantReadWriteData(backetFunction);
    return backetFunction;
  }

  private createOrderFunction(orderTable: ITable): NodejsFunction {
    const orderFunctionProps: NodejsFunctionProps = {
      bundling: {
        // externalModules property is used to specify that the aws-sdk module should be excluded from the bundled package. This is because the aws-sdk is already provided by the Lambda execution environment,
        // so there's no need to include it in the function package.
        // A list of modules that should be considered as externals (already available in the runtime).
        externalModules: ["aws-sdk/*"],
      },
      environment: {
        PRIMARY_KEY: "username",
        SORT_KEY: "orderDate",
        DYNAMODB_TABLE_NAME: orderTable.tableName, // get table name
      },
      runtime: Runtime.NODEJS_18_X,
    };
    //  NodejsFunction construct as a lambda function
    // which automatically transpiles and bundles our code, regardless if it's written in JavaScript or TypeScript
    const orderFunction = new NodejsFunction(this, "orderLambdaFunction", {
      ...orderFunctionProps,
      entry: join(__dirname, "./../src/order-service/index.ts"),
    });
    // give crud operations permission on order table to orderFunction
    orderTable.grantReadWriteData(orderFunction);
    return orderFunction;
  }
}
