import { UserModel } from "./../models/user.mongo.js";
import { authCheck } from "../helpers/auth.js";
import shortid from "shortid";
import { DateTimeResolver } from "graphql-scalars";

interface AppContext {
  token?: string;
}
const profile = async (parent: any, args: any, context: AppContext) => {
  try {
    const result = await authCheck(context.token);
    console.log({ result });
    const user = await UserModel.findOne({
      email: result,
    });
    return user;
  } catch (err) {
    throw new Error(err.message);
  }
};

const userCreate = async (parent, args, context: AppContext) => {
  try {
    console.log({ token: context.token });
    const result = await authCheck(context.token);
    const user = await UserModel.findOne({
      email: result,
    });
    console.log({ result, user });

    return user
      ? user
      : new UserModel({
          email: result,
          username: shortid.generate(),
        }).save();
  } catch (err) {
    throw new Error(err.message);
  }
};

type imageType = {
  url: string;
  public_id: string;
};

type UserUpdateArgs = {
  username: string;
  email: string;
  name: string;
  images: imageType[];
  about: string;
};

const userUpdate = async (
  parent,
  args: { input: UserUpdateArgs },
  { token }: AppContext
) => {
  try {
    console.log(args);
    const email = await authCheck(token);
    const updatedUser = await UserModel.findOneAndUpdate(
      {
        email,
      },
      {
        ...args.input,
      },
      {
        new: true,
      }
    );
    return updatedUser;
  } catch (err) {
    throw new Error(err.message);
  }
};

const publicProfile = async (parent, args: { username: string }, { req }) => {
  return await UserModel.findOne({
    username: args.username,
  });
};

const allUsers = async (parent, args: { username: string }, { req }) => {
  return await UserModel.find({});
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
  DateTime: DateTimeResolver,
};

export default auth;
