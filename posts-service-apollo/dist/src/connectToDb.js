"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectToDb = async () => {
    try {
        await mongoose_1.default.connect(process.env.DATABASE_CLOUD);
        console.log("DB connected");
    }
    catch (err) {
        console.log(`DB connection error ${err}`);
    }
};
exports.default = connectToDb;
