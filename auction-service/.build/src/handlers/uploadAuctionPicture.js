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
exports.handler = exports.uploadAuctionPicture = void 0;
var uploadPictureToS3_1 = require("../lib/uploadPictureToS3");
var getAuction_1 = require("./getAuction");
var core_1 = __importDefault(require("@middy/core"));
var http_error_handler_1 = __importDefault(require("@middy/http-error-handler"));
var http_errors_1 = __importDefault(require("http-errors"));
var validator_1 = __importDefault(require("@middy/validator"));
var uploadAuctionPictureSchema_1 = __importDefault(require("../lib/schemas/uploadAuctionPictureSchema"));
var setAuctionPictureUrl_1 = require("../lib/setAuctionPictureUrl");
var transpile_1 = require("@middy/validator/transpile");
var http_cors_1 = __importDefault(require("@middy/http-cors"));
function uploadAuctionPicture(event) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var id, email, base64String, ourBuffer, updatedAuction, pictureTag, auction, err_1, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    id = event.pathParameters.id;
                    email = event.requestContext.authorizer.email;
                    base64String = (_a = event.body) === null || _a === void 0 ? void 0 : _a.replace(/^data:image\/\w+;base64,/, "");
                    ourBuffer = Buffer.from(base64String, "base64");
                    // also when check in middy middleware validator
                    if (ourBuffer.toString("base64") !== base64String) {
                        throw new http_errors_1.default.BadRequest("An invalid base64 string was provided for the auction image.");
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, getAuction_1.getAuctionById)(id)];
                case 2:
                    auction = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    console.log(err_1);
                    throw new http_errors_1.default.InternalServerError(err_1);
                case 4:
                    // Validate auction ownership
                    if (auction.Seller !== email) {
                        throw new http_errors_1.default.Forbidden("You are not the seller of this auction");
                    }
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 8, , 9]);
                    return [4 /*yield*/, (0, uploadPictureToS3_1.uploadPictureToS3)("".concat(auction.Id, ".jpg"), ourBuffer)];
                case 6:
                    pictureTag = _b.sent();
                    return [4 /*yield*/, (0, setAuctionPictureUrl_1.setAuctionPictureUrl)(auction.Id, pictureTag)];
                case 7:
                    updatedAuction = _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    err_2 = _b.sent();
                    console.log(err_2);
                    throw new http_errors_1.default.InternalServerError(err_2);
                case 9: return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify(updatedAuction),
                    }];
            }
        });
    });
}
exports.uploadAuctionPicture = uploadAuctionPicture;
exports.handler = (0, core_1.default)(uploadAuctionPicture)
    .use((0, http_error_handler_1.default)())
    .use((0, validator_1.default)({
    eventSchema: (0, transpile_1.transpileSchema)(uploadAuctionPictureSchema_1.default),
}))
    .use((0, http_cors_1.default)());
//# sourceMappingURL=uploadAuctionPicture.js.map