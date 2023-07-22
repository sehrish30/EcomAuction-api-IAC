"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bson_1 = require("bson");
const postSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        required: "Content is required",
        // query the content
        // text: true,
    },
    image: {
        url: {
            type: String,
            default: "https://placehold.it/200x200.svg?text=post",
        },
        public_id: {
            type: String,
            default: Date.now,
        },
    },
    postedBy: {
        type: bson_1.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});
postSchema.index({ content: "text" });
exports.PostsModel = mongoose_1.default.model("Post", postSchema);
