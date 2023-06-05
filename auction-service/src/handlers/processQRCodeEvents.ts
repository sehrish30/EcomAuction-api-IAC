import { SQSEvent } from "aws-lambda";
import QRCode from 'qrcode'
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import {generateQRCode} from "../lib/generateQRCode"

// this is our serverless worker that will
// consume messages from our sqs correctly
const processQRCodeEvents = async(event: SQSEvent) => {
  // get records of sqs batch in the event object
  const records = event.Records;

  let batchItemFailures = [] as { itemIdentifier: string }[];
  if (records.length) {
    for (const record of records) {
      try {
        const parsedBody = JSON.parse(record.body);
        console.log({ parsedBody: parsedBody.detail });
        const auctionId = parsedBody.detail.auctionId
        if (typeof auctionId !== "string") {
          throw new Error("AUCTION ID IS MUST");
        }
       
       const qrCodeBuffer =  await generateQRCode(auctionId)
       await uploadPictureToS3(`${auctionId}.png`, qrCodeBuffer, "image/png")
      } catch (err) {
        // get the message id and add it to send it back to sqs
        batchItemFailures.push({
          // itemIdentifier is message id
          itemIdentifier: record.messageId,
        });
      }
    }

  }
  // message will be sent to sqs queue
  return {
    batchItemFailures,
  };
};

export const handler = processQRCodeEvents;

/**
 * serverless logs -f processQRCodeEvents
 * serverless deploy function --function processQRCodeEvents
 */
