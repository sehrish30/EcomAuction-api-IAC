import mongoose from "mongoose";
import 'dotenv/config'

const connectToDb = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_CLOUD);
    console.log("DB connected");
  } catch (err) {
    console.log(`DB connection error ${err}`);
  }
};

export default connectToDb;
