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
    "/*/*"; // arn:aws:execute-api:us-east-2:<accountId>:tb68pdfq86/*/*

  let authResponse = {} as AuthResponse;
  if (effect && globalresource) {
    let policyDocument: PolicyDocument = {
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
  let payload;
  try {
    // Validate the token from user pool
    payload = await jwtVerifier.verify(token);
    console.log("BYEE BASIT", { payload }, event.methodArn);
    console.log({
      ...generatePolicy(payload.sub, "Allow", event.methodArn, payload),
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
  return {
    ...generatePolicy(
      payload?.sub || "User",
      "Allow",
      event.methodArn,
      payload
    ),
  };
};

/**
 * https://auction-notes.auth.us-east-2.amazoncognito.com/login?response_type=token&client_id=xyz&redirect_uri=http://localhost:3000
 *
 */

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

/**
 * Wheneever there is a pull request we will get the latest code and deploy it to the environment
 * when the code is merged by the peer, anyone in the team will initiate another deployment workflow in production environment
 * which will be in production aws account
 * Serverless lambda related workflow
 */

/**
 * serverless logs -f authorizer
 * serverless deploy function --function authorizer
 */

/**
 *  payload: {
    at_hash: 'xyz',
    sub: 'xyz',
    'cognito:groups': [ 'us-east-2_hbF5JLILA_Facebook' ],
    email_verified: false,
    iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_xyz',
    'cognito:username': 'Facebook_xyz',
    nonce: 'xyz',
    aud: 'xyz',
    identities: [ [Object] ],
    token_use: 'id',
    auth_time: 1684217014,
    exp: 1684220614,
    iat: 1684217014,
    jti: 'xyz',
    email: 'xyz@gmail.com'
  }
 */
