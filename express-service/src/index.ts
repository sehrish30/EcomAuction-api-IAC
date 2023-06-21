import express, { Request, Response } from "express";
import { Worker } from "node:worker_threads";
import { join } from "path";
import serverless from "@vendia/serverless-express";

import mongoose from "mongoose";
import cookieSession from "cookie-session";
import passport from "passport";
import bodyParser from "body-parser";
import 'dotenv/config'
import { APIGatewayProxyHandler } from "aws-lambda";

import Authroute from "./routes/authRoutes";
import BlogRoute from "./routes/blogRoutes";

import "./models/User";
import "./models/Blog";
import "./services/passport";
import "./services/cache";

console.log("RUNNING FUNCTION");

// mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI!);

// create Express app instance
const app = express();

app.use(bodyParser.json());
app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [process.env.SECRET_KEY!],
  })
);

app.use("/", Authroute);
app.use("/api", BlogRoute);

app.use(passport.initialize());
app.use(passport.session());

// set up a basic GET route
app.get("/worker-threads", (req: Request, res: Response) => {
  // using our existing thread pool
  // most of tha native nodejs functions are already using libuv and their own threadpool
  // they dont work on our event loop

  // worker.js when running on production from dist folder
  // else worker.ts

  // const filePath = join(__dirname, "worker.ts");
  const filePath = join(__dirname, "worker.js");
  const worker = new Worker(filePath);

  // function is equal to thread itself
  worker.on("message", function (message) {
    // whenever worker sends message back to application
    // this function will be called
    // use keyword function because
    console.log(message);
    res.json(`Hello World! ${message}`);
  });
  // area inside worker file will be invoked when u invoke postMessage
  // postMessage thread will execute the function in worker.ts inside the worker
  worker.postMessage("start!");
});

app.get("/fast", (req, res) => {
  res.send("This was fast!");
});

// start the app
app.listen(3000, () => {
  console.log("Express app listening on port 3000!");
});

const config = {
  app,
  // event from sns will be routed to controller that handles /sns route
  // and same explanation for the rest
  eventSourceRoutes: {
    AWS_SNS: "/sns",
    AWS_DYNAMODB: "/dynamodb",
    AWS_SQS: "/sqs",
    AWS_EVENTBRIDGE: "/eventbridge",
    AWS_KINESIS_DATA_STREAM: "/kinesis",
  },
};

export const handler: APIGatewayProxyHandler = serverless(config);

/**
 * For clustering start multiple nodejs processes
 * use pm2 clustering
 * -i let pm2 decide the number of instances for our application
 * pm2 start dist index.js -i 0
 * 0 means pm2 idk what to do decide it for me
 * pm2 will setup instances = no of logical CPU cores on your computer
 * e.g 2 physical cores and if each core can process 2 threads at the same time
 * so 2 threads at the same time 2 times 2 cores is equal to 4 logical cores
 * pm2 delete index
 * pm2 list
 * pm2 show
 * pm2 show index
 * pm2 monit
 * pm2 delete index
 * pm2 kill
 *
 * ab -c 1 -n 1 localhost:3000/
 * two at the same time
 * ab -c 2 -n 2 localhost:3000/
 */

/**
 * Redis
 * node
 * const redis = require("redis")
 * const redisUrl = "redis://127.0.0.1:6379"
 * const client = redis.createClient(redisUrl)
 * client.flushall() // means remove all previous data
 * docker run -p 6379:6379 -it redis/redis-stack-server:latest
 *
 *
 * timeout values for caching
 * ability to reset all values tied to specific event
 * Fig out more robust solution for generating cache keys
 *
 * load testing
 * npx loadtest --rps 100 -k -n 1500 -c 50 https://xxxx.execute-api.us-east-1.amazonaws.com/prod/users
 */
