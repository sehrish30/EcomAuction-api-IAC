import mongoose, { Schema, Document } from "mongoose";

interface IBlog extends Document {
  title: string;
  content: string;
  createdAt: Date;
  _user: Schema.Types.ObjectId;
}

const blogSchema: Schema = new Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
  _user: { type: Schema.Types.ObjectId, ref: "User" },
});

export const Blog = mongoose.model<IBlog>("Blog", blogSchema);
