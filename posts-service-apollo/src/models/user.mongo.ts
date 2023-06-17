import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model("User", userSchema);
