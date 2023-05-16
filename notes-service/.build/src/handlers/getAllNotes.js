"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var commonMiddleware_1 = __importDefault(require("../lib/commonMiddleware"));
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var http_errors_1 = __importDefault(require("http-errors"));
var validator_1 = __importDefault(require("@middy/validator"));
var transpile_1 = require("@middy/validator/transpile");
var getAllNotesSchema_1 = __importDefault(require("../lib/schema/getAllNotesSchema"));
var node_http_handler_1 = require("@aws-sdk/node-http-handler");
/**
 * Partion key is used for: Partion of that data item, it uses hash function to determine the value
   Sort key: arranging the items within partition also can use for multiple queries
 */
var requestHandler = new node_http_handler_1.NodeHttpHandler({
    connectionTimeout: 30000,
    socketTimeout: 30000,
});
// subsequent lambda functions can reuse those http connections
// if using aws-sdk V3 (JavaScript) by default the TCP connection is reused, so no change required.
// for v2 we had to use environment AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1
var client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION,
    maxAttempts: 3,
    requestHandler: requestHandler,
});
var ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
var getAllNotes = function (event, ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var response, _a, pageSize, LastEvaluatedKey, numPageSize, input, command, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("START", process.env.AWS_REGION);
                _a = event.queryStringParameters, pageSize = _a.pageSize, LastEvaluatedKey = _a.LastEvaluatedKey;
                console.log(event.requestContext.authorizer);
                console.log({ pageSize: pageSize, LastEvaluatedKey: LastEvaluatedKey });
                numPageSize = +pageSize;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                input = {
                    TableName: process.env.NOTES_TABLE,
                    Limit: numPageSize,
                    // order may appear rough or logical at times use Query for sorting order
                    // get latest data first used pagination to avoid large response
                };
                console.log("NEWWWW", LastEvaluatedKey);
                if (LastEvaluatedKey) {
                    // ExclusiveStartKey = retrieve additional pages of results
                    input.ExclusiveStartKey = {
                        NotesId: LastEvaluatedKey,
                    };
                }
                command = new lib_dynamodb_1.ScanCommand(input);
                return [4 /*yield*/, ddbDocClient.send(command)];
            case 2:
                response = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _b.sent();
                console.log({ err: err_1.message });
                throw new http_errors_1.default.InternalServerError(err_1);
            case 4: return [2 /*return*/, {
                    statusCode: 200,
                    body: JSON.stringify({
                        response: response,
                    }),
                }];
        }
    });
}); };
exports.handler = (0, commonMiddleware_1.default)(getAllNotes).use((0, validator_1.default)({
    eventSchema: (0, transpile_1.transpileSchema)(getAllNotesSchema_1.default, {
        // @ts-ignore
        ajvOptions: {
            // if queryStringParameters were not defined
            // we will set default value as defined in the schema
            useDefaults: true,
            // user can provide or skip query parameters wont throw an error and useDefaults property will use default value from schema
            strict: false,
        },
    }),
}));
/**
 *  serverless deploy function --function getAllNotes
   serverless logs -f getAllNotes --startTime 1h
 */
//# sourceMappingURL=getAllNotes.js.map