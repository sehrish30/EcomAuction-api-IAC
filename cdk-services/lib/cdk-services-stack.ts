import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

export class CdkServicesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // dynamodb tables, Table is construct to create dynamodb table
    const productTable = new Table(this, "product", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      tableName: "product",
      // remove when cdk destroy
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

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
        DYNAMODB_TABLE_NAME: productTable.tableName, // get table name
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(5),
    };

    //  NodejsFunction construct which automatically transpiles and bundles our code, regardless if it's written in JavaScript or TypeScript
    const productFunction = new NodejsFunction(this, "productLambdaFunction", {
      ...nodeJsFunctionProps,
      entry: join(__dirname, "./../src/product-service/index.ts"),
    });

    // give crud operations permission on product table
    productTable.grantReadWriteData(productFunction);

    // proxy to false because we will define our methods
    // and resources ourselves
    // api gateway will redirect to the downstream product function
    const apigw = new LambdaRestApi(this, "productApi", {
      proxy: false,
      restApiName: "productService",
      handler: productFunction,
    });

    const product = apigw.root.addResource("product");
    product.addMethod("GET"); // get /product
    product.addMethod("POST"); // post /product

    const singleProduct = product.addResource("{id}"); // /product/{id}
    singleProduct.addMethod("GET"); // GET /product/{id}
    singleProduct.addMethod("PUT"); // PUT /product/{id}
    singleProduct.addMethod("DELETE"); // DELETE /product/{id}
  }
}

// https://github.com/aws/aws-cdk/tree/v1-main/packages/@aws-cdk
