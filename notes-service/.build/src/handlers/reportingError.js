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
// import { log } from "../lib/logger";
// import * as log from "logging";
// https://github.com/leegilmorecode/serverless-lambda-layers/blob/main/src/generate-screenshot.ts
// go into the lambda layer folder go to specific file index.ts and run this command "tsc index.ts"
// include this in tsconfig.json for layers to work,  "include": ["src/**/*.ts", "src/layers/**/node_modules/**/*"]
var logging_1 = __importDefault(require("logging"));
//  { log: { __esModule: true, default: [Function: handler] } }
// lambda layer e.g for recording metrices , logging
var reportingError = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        data = JSON.parse(event.body);
        // console.log({ logger });
        // const log = logger?.default;
        console.log({ log: logging_1.default });
        try {
            // create note database call
            (0, logging_1.default)({
                type: "INFO",
                payload: data,
            });
            // simulating error
            throw new Error("too many database connections");
        }
        catch (err) {
            (0, logging_1.default)({
                type: "CRITICAL",
                message: err.message,
                // at which line this error occured
                callstack: err.stack,
                payload: data,
            });
            return [2 /*return*/, {
                    statusCode: 500,
                    body: JSON.stringify(err),
                }];
        }
        return [2 /*return*/];
    });
}); };
exports.handler = reportingError;
/**
 * serverless logs -f reportingError
 * serverless deploy function --function reportingError
 * tsc index.ts
 */
/**
 * Challenges in Active/Active
  Race Condition(Due to concurrent request)
  Dynamo db uses (Last writer wins) for conflict resolution in DynamoDb
  Cap theorem (Consistency Or availability, Partition tolerance)
  Partition tolerance, we need this for data replication.
  stale data will be available if the data replication is not complete.
 */
//# sourceMappingURL=reportingError.js.map