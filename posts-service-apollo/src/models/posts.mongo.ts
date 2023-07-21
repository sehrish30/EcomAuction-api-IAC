import mongoose from "mongoose";
import { ObjectId } from "bson";

const postSchema = new mongoose.Schema(
  {
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
      type: ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ content: "text" });
export const PostsModel = mongoose.model("Post", postSchema);
