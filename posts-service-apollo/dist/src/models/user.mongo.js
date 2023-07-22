"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    name: {
        type: String,
    },
    images: {
        type: Array,
        default: [
            {
                url: "https://placehold.it/200x200.svg?text=profile",
                public_id: Date.now,
            },
        ],
    },
    about: {
        type: String,
    },
}, {
    timestamps: true,
});
exports.UserModel = mongoose_1.default.model("User", userSchema);
