// import mongoose
const mongoose = require("mongoose");
const { createClient } = require("redis");
require("dotenv/config");
const keys = require("../config/keys");

const REDIS_URL = "redis://127.0.0.1:6379";

// get a reference to the original exec() function
const exec = mongoose.Query.prototype.exec;

// dont add url if u want to test local 127.0.0.1:6379
// keep it createClient()
const redisClient = createClient({
  url: keys.redisUrl,
});

mongoose.Query.prototype.stringCache = function () {
  this.useStringCache = true;
  return this;
};

mongoose.Query.prototype.cache = function (options = {}) {
  // options passed from cache({key: "value"})
  // if we use .cache() with query
  // that will send this.useCache = true with that query
  // useCache is name written by me
  this.useCache = true;
  // use this key to set and get data
  // key must be number or string
  // "" incase if someone doesnot pass the key
  this.hashKey = JSON.stringify(options?.key || "");
  // some top level hash key to use
  // for caching operation
  // this returns makes .chain chainable
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache && !this.useStringCache) {
    //@ts-ignore
    return exec.apply(this, arguments);
  }

  console.log("I'm about to run a query");
  await redisClient.connect();

  if (this.useStringCache) {
    const key = JSON.stringify(Object.assign({}, this.getQuery()));
    console.log({ key }, "STRING KEY");
    const cachedValue = await redisClient.get(key);
    if (cachedValue) {
      const doc = JSON.parse(cachedValue);
      // if doc is an object it will be new this.model(doc)
      // else map or iterate over array of doc
      console.log({ doc });
      await redisClient.quit();
      // model ths result else not accepted because it will be string
      return Array.isArray(doc)
        ? doc.map((d) => new this.model(d))
        : new this.model(doc);
    }

    // @ts-ignore
    const result = await exec.apply(this, arguments);
    redisClient.set(key, JSON.stringify(result));
    await redisClient.expire(key, 300); // 300s 5 min
    await redisClient.quit();
    return result;
  }

  if (this.useCache) {
    // we cant modify it can modify actual function call
    //   console.log(this.getQuery());
    //   console.log(this.mongooseCollection.name);

    // extra logic to inject anything before
    // the query is actually sent off to MongoDB

    // intercept the query
    // check to see if the query has already been fetched
    // and if it has, return the data from Redis
    // as opposed to send the query off to Mongo

    // call the original exec() function with the correct context (this)
    // arguments
    //this.getQuery() is whatever inside find({}) means the query

    const key = JSON.stringify(
      Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name,
      })
    );

    console.log("CACHE RETURN");
    console.log({ key });
    // check redis for key
    // hget pull information out of nested hash
    const cachedValue = await redisClient.hGet(this.hashKey, key);

    // if it does exist
    if (cachedValue) {
      // attempting to deal with array of records
      // or single record

      // exec function expects us to return model instance

      // this.model is reference to this model that represents this query
      // is attached to
      // we can create new instance of that model
      // same like new Blog({})
      // hydrate all values
      const doc = JSON.parse(cachedValue);
      // if doc is an object it will be new this.model(doc)
      // else map or iterate over array of doc

      await redisClient.quit();
      console.log({ doc });
      return Array.isArray(doc)
        ? doc.map((d) => new this.model(d))
        : new this.model(doc);
    }
    console.log("MONGO RETURN");
    // else issue the query and store the result in redis

    console.log({ key });
    // @ts-ignore
    const result = await exec.apply(this, arguments);
    redisClient.hSet(this.hashKey, key, JSON.stringify(result));
    await redisClient.expire(this.hashKey, 300); // 300s 5 min

    await redisClient.quit();
    return result;
  }
};

/**
 *
 */

export const clearHash = async (hashKey) => {
  await redisClient.connect();
  await redisClient.del(JSON.stringify(hashKey));
  await redisClient.quit();
  // delete key and subkey, if you have subkey
  // await redisClient.hDel(JSON.stringify(hashKey), "sdsdsad");
};

export const clearSingleHash = async (hashKey) => {
  await redisClient.connect();
  await redisClient.del(JSON.stringify(hashKey));
  await redisClient.quit();
};
