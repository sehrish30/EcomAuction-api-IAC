import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface EcomAuctionApiGatewayProps {
  productMicroService: IFunction;
}

export class EcomAuctionApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionApiGatewayProps) {
    super(scope, id);
    // proxy to false because we will define our methods
    // and resources ourselves
    // api gateway will redirect to the downstream product function
    const apigw = new LambdaRestApi(this, "productApi", {
      proxy: false,
      restApiName: "productService",
      handler: props.productMicroService,
    });

    const product = apigw.root.addResource("product");
    product.addMethod("GET"); // get /product
    product.addMethod("POST"); // post /product

    const singleProduct = product.addResource("{id}"); // /product/{id}
    singleProduct.addMethod("GET"); // GET /product/{id}
    singleProduct.addMethod("PUT"); // PUT /product/{id}
    singleProduct.addMethod("DELETE"); // DELETE /product/{id}

    // GET product/1234?category=Phone
  }
}
