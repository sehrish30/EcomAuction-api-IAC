"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_mongo_1 = require("./../models/user.mongo");
const auth_1 = require("../helpers/auth");
const shortid_1 = __importDefault(require("shortid"));
const graphql_scalars_1 = require("graphql-scalars");
const profile = async (parent, args, context) => {
    try {
        const result = await (0, auth_1.authCheck)(context.token);
        console.log({ result });
        const user = await user_mongo_1.UserModel.findOne({
            email: result,
        });
        return user;
    }
    catch (err) {
        throw new Error(err.message);
    }
};
const userCreate = async (parent, args, context) => {
    try {
        console.log({ token: context.token });
        const result = await (0, auth_1.authCheck)(context.token);
        const user = await user_mongo_1.UserModel.findOne({
            email: result,
        });
        console.log({ result, user });
        return user
            ? user
            : new user_mongo_1.UserModel({
                email: result,
                username: shortid_1.default.generate(),
            }).save();
    }
    catch (err) {
        throw new Error(err.message);
    }
};
const userUpdate = async (parent, args, { token }) => {
    try {
        console.log(args);
        const email = await (0, auth_1.authCheck)(token);
        const updatedUser = await user_mongo_1.UserModel.findOneAndUpdate({
            email,
        }, Object.assign({}, args.input), {
            new: true,
        });
        return updatedUser;
    }
    catch (err) {
        throw new Error(err.message);
    }
};
const publicProfile = async (parent, args, { req }) => {
    return await user_mongo_1.UserModel.findOne({
        username: args.username,
    });
};
const allUsers = async (parent, args, { req }) => {
    return await user_mongo_1.UserModel.find({});
};
const auth = {
    Query: {
        profile,
        publicProfile,
        allUsers,
    },
    Mutation: {
        userCreate,
        userUpdate,
    },
    DateTime: graphql_scalars_1.DateTimeResolver,
};
exports.default = auth;
