import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  googleId: string;
  displayName: string;
}

const userSchema: Schema = new Schema({
  googleId: String,
  displayName: String,
});

const User = mongoose.model<IUser>("User", userSchema);
