import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import mongoose, { Document } from "mongoose";

import dotenv from "dotenv";

dotenv.config();

interface IUser extends Document {
  googleId: string;
  displayName: string;
}

const User = mongoose.model<IUser>("User");

passport.serializeUser((user: any, done: any) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      callbackURL: "/auth/google/callback",
      clientID: process.env.googleClientID!,
      clientSecret: process.env.googleClientSecret!,
      proxy: true,
      passReqToCallback: true,
    },
    async (
      request: any,
      accessToken: string,
      refreshToken: string,
      params: any,
      profile: any,
      done: any
    ) => {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }
        const user = await new User({
          googleId: profile.id,
          displayName: profile.displayName,
        }).save();
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
