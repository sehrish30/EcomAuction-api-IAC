import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.redisEndpoint,
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("ERROR CONNECTION TO REDIS", err?.message, err);
});

export default redisClient;
