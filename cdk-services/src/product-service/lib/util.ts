import {
  PutItemCommandOutput,
  DeleteItemCommandOutput,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import redisClient from "../redisElasticCache";

export function unMarshalItem(
  item: PutItemCommandOutput & DeleteItemCommandOutput & UpdateItemCommandOutput
) {
  const Attributes = item.Attributes!;
  console.log({ Attributes });
  const unmarshalledItem = unmarshall(Attributes);
  return unmarshalledItem;
}

export const getDataFromRedis = async (key: string, subkey: unknown) => {
  await redisClient.connect();

  const cachedValue = await redisClient.hGet(key, JSON.stringify(subkey));
  console.log(
    "BASIT GET CACHEDVALUE",
    cachedValue,
    key,
    JSON.stringify(subkey)
  );
  if (cachedValue) {
    await redisClient.quit();
    return JSON.parse(cachedValue);
  }
};

export const deleteAllKeys = async () => {
  await redisClient.connect();
  await redisClient.flushDb();
  await redisClient.quit();
};

export const saveDataInRedis = async (
  key: string,
  subkey: unknown,
  result: unknown
) => {
  // await redisClient.connect();
  // because i have decided to reuse existing conenction of redis and then close it at the end for performance

  const saved = await redisClient.hSet(
    key,
    JSON.stringify(subkey),
    JSON.stringify(result)
  );
  const cachedValue = await redisClient.hGet(key, JSON.stringify(subkey));
  console.log(
    "BASIT SET CACHEDVALUE",
    key,
    JSON.stringify(subkey),
    cachedValue
  );
  // can also simply set with key and value
  // but i wanted to keep key as useremail -> keyOfItem -> value
  // await redisClient.set(subkey, result)
  await redisClient.expire(key, 300); // 300s 5 min
  const cachedValueAfterExpiry = await redisClient.hGet(
    key,
    JSON.stringify(subkey)
  );
  console.log(
    "BASIT SET CACHEDVALUE EXPIRY",
    key,
    JSON.stringify(subkey),
    cachedValueAfterExpiry
  );
  await redisClient.quit();
};

export const disconnectRedis = async () => {
  await redisClient.quit();
};

export const clearHashInRedis = async (hashKey: string) => {
  await redisClient.connect();
  await redisClient.del(JSON.stringify(hashKey));
  await redisClient.disconnect();
  // delete key and subkey
  // await redisClient.hDel(JSON.stringify(hashKey), "sdsdsad");
};
