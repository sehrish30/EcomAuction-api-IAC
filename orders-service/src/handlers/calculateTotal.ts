
"use strict";

import { AuctionType } from './../../types/auction.table';

type CalculateTotalType = {
    auction: AuctionType;
    quantity: number
}

const calculateTotal = ({auction, quantity}:CalculateTotalType) => {
  let total = auction.HighestBidAmount || 0 * quantity;
  return {
    total,
  };
};

export const handler = calculateTotal;

/**
 * serverless logs -f calculateTotal
 * serverless deploy function --function calculateTotal
 */
