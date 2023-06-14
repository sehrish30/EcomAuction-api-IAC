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

export const saveDataInRedis = async (
  key: string,
  subkey: string,
  result: string
) => {
  console.log({ redisClient });
  await redisClient.connect();
  await redisClient.hSet(key, subkey, result);
  // can also simply set with key and value
  // but i wanted to keep key as useremail -> keyOfItem -> value
  // await redisClient.set(subkey, result)
  await redisClient.expire(key, 10);
  await redisClient.disconnect();
};

export const clearHashInRedis = async (hashKey: string) => {
  await redisClient.connect();
  await redisClient.del(JSON.stringify(hashKey));
  await redisClient.disconnect();
  // delete key and subkey
  // await redisClient.hDel(JSON.stringify(hashKey), "sdsdsad");
};
