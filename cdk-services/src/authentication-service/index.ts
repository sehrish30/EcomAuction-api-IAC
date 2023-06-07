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
        // arrays are not allowed in context only strings and this is array
        "cognito:groups": null,
        identities: null,
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

    console.log({});
  } catch (err) {
    console.log(err);
    throw err;
  }

  const result = {
    ...generatePolicy(
      payload?.sub || "User",
      "Allow",
      event.methodArn,
      payload
    ),
  };
  return {
    ...result,
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

// context: {
//   principalId: '0d144625-1ef3-46a3-8190-62eb1f3ba6d8',
//   policyDocument: { Version: '2012-10-17', Statement: [ [Object] ] },
//   context: {
//     at_hash: 'JBFgTXR6ohGPUs-cvim43Q',
//     sub: '0d144625-1ef3-46a3-8190-62eb1f3ba6d8',
//     'cognito:groups': [ 'us-east-2_hbF5JLILA_Google' ],
//     email_verified: false,
//     iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_hbF5JLILA',
//     'cognito:username': 'Google_114447427349094333382',
//     nonce: 'KF7PwjsUbdIfKe4-tDc2II6dFBeaRsGp0IgpOgj_JyNTUaMzA1RmJYowFhgYKdXvmL-WCbeLaPHzBH3abfGFWuWhSB1E68sHGRjppgAe1UngS-e1nRbcN8_LP93p2r8QggfsWmhtUDyJhjwrP9tpaUU2RU7hJ0rWLdt_8yjn1S0',
//     aud: '4j5p8adgkqvjtjtpqrbv865t15',
//     identities: [ [Object] ],
//     token_use: 'id',
//     auth_time: 1684222480,
//     exp: 1684226080,
//     iat: 1684222480,
//     jti: '0a7aff4b-0789-4bb3-836d-19911f0fff24',
//     email: 'sehrishwaheed98@gmail.com'
// }

// {
//   principalId: 'ab26c80d-2c38-4513-b3fc-0c0722cb3e39',
//   policyDocument: { Version: '2012-10-17', Statement: [ [Object] ] },
//   context: {
//     at_hash: 'hkdFrNatfIyyHq1coEotnQ',
//     sub: 'ab26c80d-2c38-4513-b3fc-0c0722cb3e39',
//     'cognito:groups': [ 'us-east-2_7aJP5VFoi_Google' ],
//     email_verified: false,
//     iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_7aJP5VFoi',
//     'cognito:username': 'Google_114447427349094333382',
//     nonce: 'LZvLVxeAXwzmxCsES3MGY_XZYJ9kSB-xRpkfscHPuralT2VHmq6xdTPZEte3D8wjKIdhxyJ3XV8PFRQ8MxEpZ9lZh0QBPkesFe56GxxwI-82zWulGgctFiiHN-C2n-T6htoyB4PH8cFeSh8e7BYwgk0Ewm44gB7bD-tD3wnzFT4',
//     aud: '1ds0a0jvbgu0ij27sceonjidb5',
//     identities: [ [Object] ],
//     token_use: 'id',
//     auth_time: 1684239471,
//     exp: 1684243071,
//     iat: 1684239471,
//     jti: '2ae8e3f4-428c-4b00-9215-a471fbeb10c9',
//     email: 'sehrishwaheed98@gmail.com'
//   }
// }

// {
//   principalId: '056a3bce-bed9-4b1f-9d44-bee685f47a73',
//   policyDocument: { Version: '2012-10-17', Statement: [ [Object] ] },
//   context: {
//     at_hash: 'Bs4R3ErIi2For-gOOJAcLw',
//     sub: '056a3bce-bed9-4b1f-9d44-bee685f47a73',
//     email_verified: true,
//     iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_7aJP5VFoi',
//     'cognito:username': 'sehrishh',
//     aud: '1ds0a0jvbgu0ij27sceonjidb5',
//     event_id: '164ea095-fff7-4ba8-ad95-a74b4de93f7f',
//     token_use: 'id',
//     auth_time: 1684240244,
//     exp: 1684243844,
//     iat: 1684240244,
//     jti: 'd87b9bdf-5363-4f9c-84e2-14db154553ba',
//     email: 'sehrishwaheed98@gmail.com'
//   }
// }
