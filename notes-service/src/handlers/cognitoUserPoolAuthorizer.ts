/**
 * Lambda authoizer we can either use token mode
 * or request mode
 * by default if we dont specify the mode in the configuration
 * it will use token mode
 * in the token mode we to pass our token in the authoizer header
 * access it in lambda authorizer using event.authorizationToken;
 */

/**
 * Will check that this token is generated from user pool that we created
 * and check token validiity and handle errors
 * and support user pool groups like
 * we can actually see when token is valid
 * what group the user belongs to
 *
 * mainly cogntio only check if user exists in user pool yes or no type of authorizer
 */

// authorizer lambda integrate with cognito to check token validity
import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  PolicyDocument,
  Context,
  APIGatewayTokenAuthorizerEvent,
  AuthResponse,
} from "aws-lambda";

const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;
// Verifier that expects valid access tokens:
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USERPOOL_ID!,
  tokenUse: "id", // either id or access
  clientId: COGNITO_WEB_CLIENT_ID!,
});
// iam policy with those attributes same format
const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string,
  payload: any = {}
): AuthResponse => {
  // Action is invoking API Gateway endpoint, Allow, Deny
  // Resouce is which endpoint are we going to invoke, API Gateway
  // arn of that particular endpoint

  // lambda authorizer in cache for 5 minutes
  // so for each and every request there wont be any invocation
  // latency of lambda authorizer
  // iam policy returned by lambda authorizer
  // works with all api end points
  // issue was for all subsequent requests
  // we were not evaluating resource again
  // all lambda have different resources
  // arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
  const tmp = resource.split(":"); // arn,aws,execute-api,{regionId},{accountId},{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
  const apiGatewayArnTmp = tmp[5].split("/"); // {apiId},{stage},{httpVerb},[{resource}/[{child-resources}]]

  // Create wildcard resource
  const globalresource =
    tmp[0] +
    ":" +
    tmp[1] +
    ":" +
    tmp[2] +
    ":" +
    tmp[3] +
    ":" +
    tmp[4] +
    ":" +
    apiGatewayArnTmp[0] + // {apiId}
    "/*/*";

  let authResponse = {} as AuthResponse;
  if (effect && globalresource) {
    let policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Resource: globalresource,
          Action: "execute-api:Invoke",
        },
      ],
    };
    // you can also add additional information you may need through context
    // this will be passed to lambda function in event.requestContext.authorizer can get context as well as principalId
    authResponse = {
      principalId,
      policyDocument,
      context: {
        ...payload,
      },
    };
  }

  return authResponse;
};

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
) => {
  const token = event.authorizationToken.replace("Bearer ", "");
  console.log("I REACHED", Math.floor(1000 + Math.random() * 9000));

  if (!token) {
    throw new Error("No token found!");
  }
  try {
    // Validate the token from user pool
    const payload = await jwtVerifier.verify(token);

    return {
      ...generatePolicy("user", "Allow", event.methodArn, payload),
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/**
 * Cognito user pool are user directories
 * User can signup/signin either directly in cognito or SSO
 * Cognito leverages common OAUTH 2.0 flows such as implicit Auth flow
 * Tiggers allow u to hook in auth stages
 * integrate with cognito through amplify or aws sdk
 */
/**
 * Identity pool short term AWS access for users
 * Integrate your identity provider with your identity pool
 * Guest access for restrictive authorization
 *
 */
