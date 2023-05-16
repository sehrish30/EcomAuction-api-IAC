"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_error_handler_1 = __importDefault(require("@middy/http-error-handler"));
var core_1 = __importDefault(require("@middy/core"));
var http_event_normalizer_1 = __importDefault(require("@middy/http-event-normalizer"));
var http_json_body_parser_1 = __importDefault(require("@middy/http-json-body-parser"));
// each lambda defines allowed origins in each lambda functions
var http_cors_1 = __importDefault(require("@middy/http-cors"));
exports.default = (function (handler) {
    return (0, core_1.default)(handler).use([
        // automatically parse our stringified event body
        (0, http_json_body_parser_1.default)(),
        // will automatically adjust the API Gateway event objects
        // to prevent us from accidently having non existing object when
        // trying to access path parameters or query parameters
        (0, http_event_normalizer_1.default)(),
        // handle errors smoothly
        (0, http_error_handler_1.default)(),
        // accept requests from all origins in the web not recommended in the frontend
        // specify specific urls both in serverless.yml and middy middleware
        (0, http_cors_1.default)(),
        /**
         * httpCors({
          origin: 'https://example.com',
          headers: 'Content-Type,Authorization,X-Api-Key',
          credientials: true
          })
         */
    ]);
});
//# sourceMappingURL=commonMiddleware.js.map