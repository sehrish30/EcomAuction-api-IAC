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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
var client = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION,
    apiVersion: "2012-08-10",
});
var eventBridgeClient = new client_eventbridge_1.EventBridgeClient({
    region: process.env.AWS_REGION,
});
var EVENT_BUS_NAME = process.env.EventBusName;
var EVENTSOURCE = process.env.EVENTNAME;
var EVENTNAME = process.env.EVENTSOURCE;
var ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
var contactExternalAPI = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var records, batchItemFailures, _i, records_1, record, parsedBody, EXTERNAL_API, input, command, response, err_1, ttl, timestamp, expirationTimestamp, ttlTable, putCommand, putResponse, params, command_1, data, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                records = event.Records;
                batchItemFailures = [];
                if (!(records === null || records === void 0 ? void 0 : records.length)) return [3 /*break*/, 12];
                _i = 0, records_1 = records;
                _a.label = 1;
            case 1:
                if (!(_i < records_1.length)) return [3 /*break*/, 12];
                record = records_1[_i];
                parsedBody = JSON.parse(record.body);
                EXTERNAL_API = "AB45w3";
                input = {
                    ExpressionAttributeValues: {
                        ":ApiId": EXTERNAL_API,
                    },
                    ExpressionAttributeNames: {
                        "#ApiId": "ApiId",
                    },
                    KeyConditionExpression: "#ApiId = :ApiId",
                    TableName: process.env.HEARTBEAT_TABLE_NAME,
                };
                command = new lib_dynamodb_1.QueryCommand(input);
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, ddbDocClient.send(command)];
            case 3:
                response = _a.sent();
                console.log({ items: response.Items });
                // means external api is down
                if (response.Items) {
                    throw new Error("Circuit breaker");
                }
                return [3 /*break*/, 5];
            case 4:
                err_1 = _a.sent();
                console.log(err_1);
                batchItemFailures.push({
                    itemIdentifier: record.messageId,
                });
                return [3 /*break*/, 5];
            case 5:
                _a.trys.push([5, 10, , 11]);
                console.log({ parsedBody: parsedBody.detail });
                if (!parsedBody.detail.error) return [3 /*break*/, 7];
                ttl = 5 * 60 * 1000;
                timestamp = new Date().getTime();
                expirationTimestamp = timestamp + ttl;
                ttlTable = {
                    Item: {
                        TTL: expirationTimestamp,
                        ApiId: EXTERNAL_API,
                    },
                    TableName: process.env.HEARTBEAT_TABLE_NAME,
                };
                putCommand = new lib_dynamodb_1.PutCommand(ttlTable);
                return [4 /*yield*/, ddbDocClient.send(putCommand)];
            case 6:
                putResponse = _a.sent();
                console.log({ putResponse: putResponse });
                return [3 /*break*/, 9];
            case 7:
                params = {
                    Entries: [
                        {
                            Source: EVENTSOURCE,
                            DetailType: EVENTNAME,
                            Detail: JSON.stringify({
                                vehicleDetail: 121,
                            }),
                            EventBusName: EVENT_BUS_NAME,
                        },
                    ],
                };
                command_1 = new client_eventbridge_1.PutEventsCommand(params);
                return [4 /*yield*/, eventBridgeClient.send(command_1)];
            case 8:
                data = _a.sent();
                console.log({ data: data });
                _a.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                err_2 = _a.sent();
                console.log(err_2);
                batchItemFailures.push({
                    itemIdentifier: record.messageId,
                });
                return [3 /*break*/, 11];
            case 11:
                _i++;
                return [3 /*break*/, 1];
            case 12: return [2 /*return*/, batchItemFailures];
        }
    });
}); };
exports.handler = contactExternalAPI;
/**
 * serverless logs -f contactExternalAPI
 * serverless deploy function --function contactExternalAPI
 */
//# sourceMappingURL=contactExternalAPI.js.map