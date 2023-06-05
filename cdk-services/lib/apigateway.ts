import {
  AwsIntegration,
  LambdaRestApi,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IRole, Role } from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";

interface EcomAuctionApiGatewayProps {
  productMicroService: IFunction;
  basketMicroService: IFunction;
  orderMicroService: IFunction;
  checkoutStateMachine: StateMachine;
  stateMachineIamExecutionRole: Role;
}

export class EcomAuctionApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: EcomAuctionApiGatewayProps) {
    super(scope, id);

    this.createProductApi(props.productMicroService);
    this.creatBasketApi(props.basketMicroService);
    this.creatOrderApi(props.orderMicroService);
    this.stateMachineCheckoutOrder(
      props.checkoutStateMachine,
      props.stateMachineIamExecutionRole
    );
  }

  private createProductApi(productMicroService: IFunction) {
    // proxy to false because we will define our methods
    // and resources ourselves
    // api gateway will redirect to the downstream product function
    const apigw = new LambdaRestApi(this, "productApi", {
      proxy: false,
      restApiName: "productService",
      handler: productMicroService,
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
  private creatBasketApi(basketMicroService: IFunction) {
    const apigw = new LambdaRestApi(this, "basketApi", {
      proxy: false,
      restApiName: "basketService",
      handler: basketMicroService,
    });

    // resource name = basket/{userName}
    const basket = apigw.root.addResource("basket");
    basket.addMethod("GET"); // GET /basket
    basket.addMethod("POST"); // POST /basket

    const singleBasket = basket.addResource("{userName}");
    singleBasket.addMethod("GET"); // GET /basket/{userName}
    singleBasket.addMethod("DELETE"); // DELETE /basket/{userName}

    const basketCheckout = basket.addResource("checkout");
    basketCheckout.addMethod("POST"); // POST /basket/checkout
  }

  private creatOrderApi(orderMicroService: IFunction) {
    const apigw = new LambdaRestApi(this, "orderApi", {
      proxy: false,
      restApiName: "orderService",
      handler: orderMicroService,
    });

    // resource name = order
    const order = apigw.root.addResource("order");
    order.addMethod("GET"); // GET /order

    const singleOrder = order.addResource("{userName}");
    singleOrder.addMethod("GET"); // GET /order/{userName} OR /order/{userName}?userName=""
  }

  private stateMachineCheckoutOrder(
    checkoutStateMachine: StateMachine,
    stateMachineIamExecutionRole: IRole
  ) {
    const apigwIntegration = new AwsIntegration({
      service: "states",
      integrationHttpMethod: "POST",
      action: "StartExecution", // name of the api that we want api gateway to invoke
      options: {
        credentialsRole: stateMachineIamExecutionRole, // assume this role to invoke action "StartExecution"
        integrationResponses: [
          {
            selectionPattern: "200",
            statusCode: "201",
            responseTemplates: {
              "application/json": `
                {
                  "result": $input.json('$')
                }
              `,
            },
          },
        ],
        // add the arn of the state machine on the request
        // so client should have to include arn for that state machine
        // we dont want to expose out state machine arn to client
        // so we will inject arn into this payload without user doing anything, from security standpoint
        // so we can take advantage of mapping template
        // input: "$util.escapeJavaScript($input.json('$'))", input: "$util.escapeJavaScript($input).replaceAll("\\'", "'")"
        requestTemplates: {
          "application/json": `{
                "input": "$util.escapeJavaScript($input.json('$'))",
                "stateMachineArn": "${checkoutStateMachine.stateMachineArn}"
              }`,
        },
      },
    });

    const options = {
      methodResponses: [
        {
          statusCode: "201",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
    };

    const api = new RestApi(this, "checkout-state-machine", {
      restApiName: "Checkout State Machine",
    });

    // Define API Gateway resource and method
    const resource = api.root.addResource("checkout-order");
    resource.addMethod("POST", apigwIntegration, options);

    // grant permission to given iam role to start an execution of this state machine, this role is assumed by api gateway
    checkoutStateMachine.grantStartExecution(stateMachineIamExecutionRole);

    /**
     * result of state machine api gateway execution
     * {
        "result": {
            "executionArn": "arn",
            "startDate": 1.68596764488E9
       }
      }
     */
  }
}
