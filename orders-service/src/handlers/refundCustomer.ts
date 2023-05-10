"use strict";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

type BillCustomerType = {
  total: { total: number };
  email: string;
  billingStatus: {
    message: string;
    chargeId: string;
  };
};

const refundFromStripe = async (charge: string, amount: number) => {
  return await stripe.refunds.create({
    charge,
    amount, // refund amount in cents
    reason: "requested_by_customer", // optional
  });
};

const refundCustomer = async ({ total, billingStatus }: BillCustomerType) => {
  // bill the customer call stripe
  // from frontend u can pass along stripe token
  // and inject it into state machine
  console.log({ billCustomer: total, billingStatus });
  try {
    const refund = await refundFromStripe(billingStatus.chargeId, total.total);
    console.log({ refund });
    return "Successfully billed by stripe";
  } catch (err) {
    throw new Error(err);
  }
};

export const handler = refundCustomer;

/**
 * serverless logs -f refundCustomer
 * serverless deploy function --function refundCustomer
 */

// {
//   "auctionId": "2997905a-e700-4797-88ac-d2208171ee98",
//   "quantity": 4,
//   "email": "sehrishwaheed98@gmail.com",
//   "redeem": true,
// }

/**
 * curl https://api.stripe.com/v1/refunds \
  -u sk_test_your_key: \
  -d charge=ch_1Ix98GAdvemoYxG9I90lUhrH
 */
