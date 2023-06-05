import {
  PutItemCommandOutput,
  DeleteItemCommandOutput,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export function unMarshalItem(
  item: PutItemCommandOutput & DeleteItemCommandOutput & UpdateItemCommandOutput
) {
  const Attributes = item.Attributes!;
  console.log({ Attributes });
  const unmarshalledItem = unmarshall(Attributes);
  return unmarshalledItem;
}
