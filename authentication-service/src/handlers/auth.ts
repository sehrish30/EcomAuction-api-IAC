/**
 * takes authorization token from request headers verifies the signature if valid allow to exceute else deny
 */
import * as jwt from "jsonwebtoken";
import {
  APIGatewayTokenAuthorizerEvent,
  Context,
  PolicyDocument,
  AuthResponse,
} from "aws-lambda";

/**
 * Takes authorization token from the req header
 * and verify signature
 * and it will allow us to execute another lambda
 * You set it API Gateway to authorize each request
 * and if request is successfully authorized will move to create Auction or forward
 * with user details and claims of token and if request fails u get authorized error
 */

// By default, API Gateway authorizations are cached (TTL) for 300 seconds.
// This policy will authorize all requests to the same API Gateway instance where the
// request is coming from, thus being efficient and optimising costs.
// execute any lambda function in the target api gateway
// this policy allows us invocation of target lambda
const generatePolicy = (
  principalId: string | (() => string) | undefined,
  methodArn: string
): AuthResponse => {
  // authorized to invoke any other lambda in the same api gateway
  // authorizations are cached for 3000s by default
  // arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
  // convert it to arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/*
  // methodArn.split("/", 2).join("/") + "/*";
  const apiGatewayWildcard = `${methodArn.split("/", 2).join("/")}/*`;

  const policyDocument: PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: "Allow",
        // any lambda function in the target api gateway
        Resource: apiGatewayWildcard,
      },
    ],
  };

  return {
    principalId,
    policyDocument,
  } as AuthResponse;
};

// APIGatewayTokenAuthorizerEvent because lambda authorizer
export async function handler(
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
) {
  if (!event.authorizationToken) {
    throw "Unauthorized";
  }

  const token = event.authorizationToken.replace("Bearer ", "");

  try {
    const claims = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY as string);
    const policy = generatePolicy(claims.sub, event.methodArn);

    return {
      ...policy,
      // pass any other information to target function
      // useful information contain user email etc
      // event.requestContext.authorizer can be accessed like that by any lambda functions
      context: claims,
    };
  } catch (error) {
    console.log(error);
    throw "Unauthorized";
  }
}

// serverless logs -f auth
