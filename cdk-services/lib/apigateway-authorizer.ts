import { Duration } from "aws-cdk-lib";
import {
  CognitoUserPoolsAuthorizer,
  TokenAuthorizer,
} from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface EcomAuctionApiGatewayProps {
  UserPool: UserPool;
  UserPoolClientId: string;
}

export class EcomAuctionApiGatewayAuthorizer extends Construct {
  public readonly cognitoAuthorizer: CognitoUserPoolsAuthorizer;
  public readonly customCognitoAuthorizer: TokenAuthorizer;

  constructor(scope: Construct, id: string, props: EcomAuctionApiGatewayProps) {
    super(scope, id);
    this.cognitoAuthorizer = this.createcognitoAuthorizer(props.UserPool);
    this.customCognitoAuthorizer = this.createCustomCongitoAuthorizer(
      props.UserPool,
      props.UserPoolClientId
    );
  }

  private createCustomCongitoAuthorizer(
    userpool: UserPool,
    UserPoolClientId: string
  ): TokenAuthorizer {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        // externalModules property is used to specify that the aws-sdk module should be excluded from the bundled package. This is because the aws-sdk is already provided by the Lambda execution environment,
        // so there's no need to include it in the function package.
        externalModules: ["@aws-sdk/*"],
      },
      environment: {
        COGNITO_USERPOOL_ID: userpool.userPoolId,
        COGNITO_WEB_CLIENT_ID: UserPoolClientId,
      },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.seconds(3),
      memorySize: 128, // default
    };
    const authorizerFunction = new NodejsFunction(
      this,
      "authorizerLambdaFunction",
      {
        ...nodeJsFunctionProps,
        entry: join(__dirname, "./../src/authentication-service/index.ts"),
      }
    );
    /**
     * Token based lambda authorizer that recognizes the caller's identity as a bearer token,
     * such as a JSON Web Token (JWT) or an OAuth token.
     */

    return new TokenAuthorizer(this, "TokenAuthorizer", {
      handler: authorizerFunction,
      identitySource: "method.request.header.Authorization",
    });
  }
  private createcognitoAuthorizer(
    userPool: UserPool
  ): CognitoUserPoolsAuthorizer {
    /**
     * a higher-level construct that specifically creates an authorizer for API Gateway using Amazon Cognito user pools.
     * This authorizer is pre-configured to perform authentication and authorization against a Cognito user pool,
     */
    return new CognitoUserPoolsAuthorizer(this, "ecom-auction-authorizer", {
      cognitoUserPools: [userPool],
      identitySource: "method.request.header.Authorization",
      authorizerName: "ecom-auction-authorizer",
    });
  }
}

/**
 *  a lower-level construct that allows you to create custom authorizers for API Gateway using AWS CloudFormation.
 *  With CfnAuthorizer, you can define your own Lambda function to perform authentication and authorization,
 *  and configure various options such as the authorizer type, identity source, and authorization scopes.
 */
