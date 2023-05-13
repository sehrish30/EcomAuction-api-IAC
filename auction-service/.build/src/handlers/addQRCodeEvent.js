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
var client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
var eventBridgeClient = new client_eventbridge_1.EventBridgeClient({
    region: process.env.REGION,
});
var EVENT_BUS_NAME = process.env.EventBusName;
var EVENT_BRIDGE_SOURCE = process.env.EVENT_BRIDGE_SOURCE;
var AUCTION_DETAIL_TYPE = process.env.AUCTION_DETAIL_TYPE;
var addQRCodeEvent = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var body, data, params, command, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                body = JSON.parse(event.body);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                params = {
                    Entries: [
                        {
                            Source: EVENT_BRIDGE_SOURCE,
                            DetailType: AUCTION_DETAIL_TYPE,
                            Detail: JSON.stringify({
                                auctionId: body.auctionId,
                            }),
                            EventBusName: EVENT_BUS_NAME,
                        },
                    ],
                };
                command = new client_eventbridge_1.PutEventsCommand(params);
                return [4 /*yield*/, eventBridgeClient.send(command)];
            case 2:
                data = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                return [2 /*return*/, {
                        statusCode: 500,
                        body: JSON.stringify(err_1.message),
                    }];
            case 4: return [2 /*return*/, {
                    statusCode: 200,
                    body: JSON.stringify(data),
                }];
        }
    });
}); };
exports.handler = addQRCodeEvent;
/**
 * serverless logs -f addQRCodeEvent
 * serverless deploy function --function addQRCodeEvent
 */
// # lambda consumer to batch process these messages that are in the queue
// # batch processing SQS messages with AWS Lambda
// # reserved concurrency to lambda function
// # standard queue batch size is 10,000
// # lambda does long polling
// # wait before processing set attribute
// # set Maximum Batching window(how long to wait for messages)
// # Visibility timeout and lambda timeout
/**
 * Visibility timeout meeans 5 sec that means if one of the messages
 * are being taken by one of the workers
 * given to lambda by worker
 * sqswill wait up to 5 sec allowing lambda to finish the processing of that particular message
 * if lambda couldnot process within that five second time,
 * That message will reappear in the queue
 * then that message will be processed by another
 * lambda function
 * it is really imp that u configure this visibility timeout value properly
 * recommended visiblity timeout value should be 6x of lambda timeout
 * for lambda we can setup timeout upto 15 min but default is 6s
 * so maximum timeout for visiblity should be 6*6+batchvalueoflambdasbysqs
 * so 6*^+5 otherwiswe ur message will reappear in the sqs queue
 * while previous lambdas are procesing the message
 * and then processed by another lambda as well
 */
/**
 * HAndling partial failures
 * We process messages batch by batch in lambda function
 * failed messages should be sent back to sqs by default
 * so next lambda functions will fetch those messages and start processing it
 * thats y u should track the messages that are failed to process
 * and put those messages into this batch item failure object and send
 * those messages to sqs
 */
/**
 * Return Failure messages on:
 * Report batch item failures objects
 */
/**
 * Use dead letter queue
 * Define how many times message can come back to sqs queue
 * and depending upon a certain number lets say after the 2 time it got back to sqs queue
 * we are not gng to process them further, we will send them to dead letetr queue
 * to further investigate what has gone wrong with those messages
 * otherwise they will keep appearing and use lambda functions
 * and will never stop
 */
/**
 * Lambda function that will process messages in sqs in batches
 */
//# sourceMappingURL=addQRCodeEvent.js.map