import createError from "http-errors";
import { ScheduledEvent, Context } from "aws-lambda";

import { closeAuction } from "../lib/closeAuction";
import { getEndedAuctions } from "../lib/getEndedAuctions";

/**
 * We need to process all auctions that have status open
 * and end date is in the past
 * so we will use GSI (Status, EndingAt)
 */
async function processAuctions(event: ScheduledEvent, context: Context) {
  try {
    // first get all ended auctions
    const auctionsToClose = await getEndedAuctions();

    /**
     * performance reasons close all
        for each iternation return promise result of closeAuction
        so we end up with array of promises here
        so we dont have to wait for close operations sequentially
        so all happen at the same time
        we just wait for the end result
     */
    const closePromises = auctionsToClose?.map((auction) =>
      closeAuction(auction)
    );
    // closedPromises = [ [Object], [Object] ]
    await Promise.all(closePromises); // [ Promise { [ [Object], [Object] ] } ]

    console.log(closePromises);

    // return is not a normal http structure
    // not triggered by api gateway
    // so we can return custom response
    return {
      closePromises: closePromises.length,
    };
  } catch (err) {
    console.log(err);
    throw new createError.InternalServerError(err);
  }
}

export const handler = processAuctions;

/**
 *  with -l u will get logs of invoked function
 * serverless invoke -f processAuctions -l
 * serverless logs -f processAuctions
 * serverless deploy function --function processAuctions
 */
