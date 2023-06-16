// import mongoose
import mongoose from "mongoose";
import redis from "redis";
import { createClient } from "redis";

interface Icache {
  key: string;
}
declare module "mongoose" {
  interface DocumentQuery<
    T,
    DocType extends import("mongoose").Document,
    QueryHelpers = {}
  > {
    mongooseCollection: {
      name: any;
    };
    cache(arg0: Icache): Promise<DocumentQuery<T[], Document> & QueryHelpers>;
    useCache: boolean;
    hashKey: string;
    exec(): Promise<T>;
  }

  interface Query<ResultType, DocType, THelpers = {}, RawDocType = DocType>
    extends DocumentQuery<any, any> {
    exec(): Promise<ResultType[]>;
  }
}

// get a reference to the original exec() function
const exec = mongoose.Query.prototype.exec;

const redisClient = createClient();

// override the function and add additional logic
/**
 * If we add additional functions to prototype object
 * they will be available to any query that we create inside
 * of our application
 */

interface Options {
  key?: string;
}

mongoose.Query.prototype.cache = function (options: Options = {}) {
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
  if (!this.useCache) {
    //@ts-ignore
    return exec.apply(this, arguments);
  }
  console.log("I'm about to run a query");
  await redisClient.connect();

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

    await redisClient.disconnect();
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
  // redisClient.hSet(this.hashKey, key, JSON.stringify(result), {
  //   // expiration time in 10s automatic
  //   EX: 10,
  // });
  // key, field, value
  // , {
  // EX: 10,
  // }

  await redisClient.disconnect();
  return result;
};

/**
 *
 */

export const clearHash = async (hashKey: string) => {
  await redisClient.connect();
  await redisClient.del(JSON.stringify(hashKey));
  await redisClient.disconnect();
  // delete key and subkey
  // await redisClient.hDel(JSON.stringify(hashKey), "sdsdsad");
};
