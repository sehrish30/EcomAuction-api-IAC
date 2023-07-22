"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCheckREST = exports.tokenIsNotValid = exports.authCheck = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const fbServiceAccountKey_json_1 = __importDefault(require("../../config/fbServiceAccountKey.json"));
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(fbServiceAccountKey_json_1.default),
});
// graphql req.headers auth logic
const authCheck = async (token) => {
    if (token) {
        // check validatiy of token
        try {
            const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
            const email = decodedToken.email;
            return email;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
    else {
        throw new Error("Unauthorized");
    }
};
exports.authCheck = authCheck;
const tokenIsNotValid = async (token) => {
    if (token) {
        // check validatiy of token
        try {
            console.log("TOKEN", token);
            const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
            const email = decodedToken.email;
            return false;
        }
        catch (err) {
            console.log(err);
            return true;
        }
    }
    else {
        return true;
    }
};
exports.tokenIsNotValid = tokenIsNotValid;
const authCheckREST = async (req, res, next) => {
    try {
        if (req.headers.token) {
            await (0, auth_1.getAuth)().verifyIdToken(req.headers.token);
            next();
        }
    }
    catch (err) {
        return res.status(403).json({
            err,
        });
    }
};
exports.authCheckREST = authCheckREST;
