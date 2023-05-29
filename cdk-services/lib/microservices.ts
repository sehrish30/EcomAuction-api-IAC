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
}

// EcomAuction is company name
// props parameter, to communicate between 2 solution constructs

export class EcomAuctionServices extends Construct {
  public readonly productMicroservice: NodejsFunction;

  constructor(scope: Construct, id: string, props: EcomAuctionServicesProps) {
    super(scope, id);

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
        // inclung libraries in our function
        externalModules: ["aws-sdk", "aws-lambda"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: props.productTable.tableName, // get table name
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
    props.productTable.grantReadWriteData(productFunction);

    this.productMicroservice = productFunction;
  }
}
