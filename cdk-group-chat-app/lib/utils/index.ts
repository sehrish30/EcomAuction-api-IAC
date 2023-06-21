import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ksuid = require("ksuid");

export const uuid = (): string => {
  return ksuid.randomSync().string;
};

export const executeTransactWrite = async (
  params: DocumentClient.TransactWriteItemsInput,
  docClient: DocumentClient
): Promise<DocumentClient.TransactWriteItemsOutput> => {
  // transactional write operation on multiple items
  const transactionRequest = docClient.transactWrite(params);

  let cancellationReasons: any[];

  transactionRequest.on("extractError", (response) => {
    try {
      cancellationReasons = JSON.parse(
        response.httpResponse.body.toString()
      ).CancellationReasons;
    } catch (err) {
      // suppress this just in case some types of errors aren't JSON parseable
      console.error("Error extracting cancellation error", err);
    }
  });

  return new Promise((resolve, reject) => {
    transactionRequest.send((err, response) => {
      if (err) {
        console.error("Error performing transactWrite", {
          cancellationReasons,
          err,
        });
        return reject({
          cancellationReasons,
          err,
        });
      }
      return resolve(response);
    });
  });
};
