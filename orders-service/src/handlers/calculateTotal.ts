"use strict";

import { AuctionType } from "./../../types/auction.table";

type CalculateTotalType = {
  auction: AuctionType;
  quantity: number;
};

const calculateTotal = async ({ auction, quantity }: CalculateTotalType) => {
  let total = 0;
  if (auction.HighestBidAmount) {
    total = auction.HighestBidAmount * quantity;
  }
  console.log({ total, high: auction.HighestBidAmount });
  return {
    total,
  };
};

export const handler = calculateTotal;

/**
 * serverless logs -f calculateTotal
 * serverless deploy function --function calculateTotal
 */
