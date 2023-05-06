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
var http_errors_1 = __importDefault(require("http-errors"));
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var validator_1 = __importDefault(require("@middy/validator"));
var transpile_1 = require("@middy/validator/transpile");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var placeBidSchema_1 = __importDefault(require("../lib/schemas/placeBidSchema"));
var getAuction_1 = require("./getAuction");
var commonMiddleware_1 = __importDefault(require("../lib/commonMiddleware"));
var client = new client_dynamodb_1.DynamoDBClient({
    region: "us-east-2",
    apiVersion: "2012-08-10",
});
var ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
function placeBid(event, ctx) {
    return __awaiter(this, void 0, void 0, function () {
        var id, amount, email, auction, params, response, command, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = event.pathParameters.id;
                    amount = event.body.amount;
                    email = event.requestContext.authorizer.email;
                    return [4 /*yield*/, (0, getAuction_1.getAuctionById)(id)];
                case 1:
                    auction = _a.sent();
                    // Bid identitly validation
                    if (email === (auction === null || auction === void 0 ? void 0 : auction.Seller)) {
                        throw new http_errors_1.default.Forbidden("You cannot bid your own auctions");
                    }
                    // avoid double bidding when already you have highest bid
                    if (email === (auction === null || auction === void 0 ? void 0 : auction.HighestBidAmount)) {
                        throw new http_errors_1.default.Forbidden("You are already the highest bidder");
                    }
                    // Only place bid for open auctions
                    if (auction.Status !== "OPEN") {
                        throw new http_errors_1.default.Forbidden("You cannot bid on closed auctions");
                    }
                    // Bid amount validation
                    if ((auction === null || auction === void 0 ? void 0 : auction.HighestBidAmount) && amount <= +(auction === null || auction === void 0 ? void 0 : auction.HighestBidAmount)) {
                        throw new http_errors_1.default.Forbidden("You bid must be higher than ".concat(auction.HighestBidAmount));
                    }
                    params = {
                        TableName: process.env.AUCTIONS_TABLE_NAME,
                        ExpressionAttributeNames: {
                            "#HBA": "HighestBidAmount",
                            "#HBB": "HighestBidBidder",
                        },
                        ExpressionAttributeValues: {
                            ":amount": amount,
                            ":bidder": email,
                        },
                        Key: {
                            Id: id,
                        },
                        UpdateExpression: "SET #HBA = :amount, #HBB = :bidder",
                        // item we have just updated
                        ReturnValues: "ALL_NEW",
                    };
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    command = new lib_dynamodb_1.UpdateCommand(params);
                    return [4 /*yield*/, ddbDocClient.send(command)];
                case 3:
                    response = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.error(err_1);
                    throw new http_errors_1.default.InternalServerError(err_1);
                case 5: return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify(response),
                    }];
            }
        });
    });
}
exports.handler = (0, commonMiddleware_1.default)(placeBid).use((0, validator_1.default)({
    eventSchema: (0, transpile_1.transpileSchema)(placeBidSchema_1.default),
}));
// serverless deploy function --function placeBid
// serverless logs -f placeBid --startTime 1h
/**
 * event.requestContext.authorizer =
 * {
  "nickname": "sehrishwaheed98",
  "name": "sehrishwaheed98@gmail.com",
  "picture": "https://s.gravatar.com/avatar/f2ec43d44b79520fb880f0b00b1f62b9?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fse.png",
  "updated_at": "2023-03-24T21:29:32.633Z",
  "email": "sehrishwaheed98@gmail.com",
  "email_verified": false,
  "iss": "https://dev-mtzrfmcr246svjn6.us.auth0.com/",
  "aud": "ky4C6XXzXQhXHNnnPh9iDJqo6QW59zPV",
  "iat": 1679693372,
  "exp": 1679729372,
  "sub": "auth0|641e11cff939365a568f0faf"
}
 */
//# sourceMappingURL=placeBid.js.map