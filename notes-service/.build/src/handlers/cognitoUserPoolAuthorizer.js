"use strict";
/**
 * Lambda authoizer we can either use token mode
 * or request mode
 * by default if we dont specify the mode in the configuration
 * it will use token mode
 * in the token mode we to pass our token in the authoizer header
 * access it in lambda authorizer using event.authorizationToken;
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
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
var aws_jwt_verify_1 = require("aws-jwt-verify");
var COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
var COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;
// Verifier that expects valid access tokens:
var jwtVerifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
    userPoolId: COGNITO_USERPOOL_ID,
    tokenUse: "id",
    clientId: COGNITO_WEB_CLIENT_ID,
});
// iam policy with those attributes same format
var generatePolicy = function (principalId, effect, resource, payload) {
    // Action is invoking API Gateway endpoint, Allow, Deny
    // Resouce is which endpoint are we going to invoke, API Gateway
    // arn of that particular endpoint
    if (payload === void 0) { payload = {}; }
    // lambda authorizer in cache for 5 minutes
    // so for each and every request there wont be any invocation
    // latency of lambda authorizer
    // iam policy returned by lambda authorizer
    // works with all api end points
    // issue was for all subsequent requests
    // we were not evaluating resource again
    // all lambda have different resources
    // arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
    var tmp = resource.split(":"); // arn,aws,execute-api,{regionId},{accountId},{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
    var apiGatewayArnTmp = tmp[5].split("/"); // {apiId},{stage},{httpVerb},[{resource}/[{child-resources}]]
    // Create wildcard resource
    var globalresource = tmp[0] +
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
    var authResponse = {};
    if (effect && globalresource) {
        var policyDocument = {
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
            principalId: principalId,
            policyDocument: policyDocument,
            context: __assign({}, payload),
        };
    }
    return authResponse;
};
var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var token, payload, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = event.authorizationToken.replace("Bearer ", "");
                console.log("I REACHED", Math.floor(1000 + Math.random() * 9000));
                if (!token) {
                    throw new Error("No token found!");
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, jwtVerifier.verify(token)];
            case 2:
                // Validate the token from user pool
                payload = _a.sent();
                console.log("BYEE BASIT", { payload: payload }, event.methodArn);
                console.log(__assign({}, generatePolicy(payload.sub, "Allow", event.methodArn, payload)));
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.log(err_1);
                throw err_1;
            case 4: return [2 /*return*/, __assign({}, generatePolicy((payload === null || payload === void 0 ? void 0 : payload.sub) || "User", "Allow", event.methodArn, payload))];
        }
    });
}); };
exports.handler = handler;
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
//# sourceMappingURL=cognitoUserPoolAuthorizer.js.map