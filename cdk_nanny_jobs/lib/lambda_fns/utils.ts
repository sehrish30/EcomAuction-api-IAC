import {
  DynamoDBClient,
  TransactWriteItemsInput,
  TransactWriteItemsOutput,
  // TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

import ksuid = require("ksuid");

export const uuid = (): string => {
  return ksuid.randomSync().string;
};

export const executeTransactWrite = async (
  params: any,
  docClient: DynamoDBClient
): Promise<TransactWriteItemsOutput> => {
  const ddbDocClient = DynamoDBDocumentClient.from(docClient);
  // transactional write operation on multiple items
  // const transactionRequest = docClient.transactWrite(params);
  const command = new TransactWriteCommand(params);

  return new Promise(async (resolve, reject) => {
    try {
      const response = await ddbDocClient.send(command);
      return resolve(response);
    } catch (err) {
      return reject({ err });
    }
  });
};
