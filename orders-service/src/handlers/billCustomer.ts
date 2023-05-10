"use strict";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

type BillCustomerType = {
  total: { total: number };
  email: string;
  token: string;
};

const createPaymentIntent = async (
  amount: number,
  currency: "usd",
  customer: string,
  token: string
) => {
  // https://stripe.com/docs/api/payment_intents/create#create_payment_intent-payment_method_options-card-cvc_token
  return await stripe.paymentIntents.create({
    amount: +amount,
    currency: "USD",
    payment_method_types: ["card"],
    payment_method_data: {
      // @ts-ignore
      type: "card",
      card: {
        token,
      },
    },
    confirm: true, // Set to `true` to immediately confirm and capture the payment
  });
};

const billCustomer = async ({ total, email, token }: BillCustomerType) => {
  // bill the customer call stripe
  // from frontend u can pass along stripe token
  // and inject it into state machine
  console.log({ billCustomer: total, token });
  try {
    // Create a Payment Intent for customer
    const paymentIntent = await createPaymentIntent(
      total.total,
      "usd",
      email,
      token
    );
    console.log({ paymentIntent });
    // Retrieve the Payment Intent
    const retrievedPaymentIntent: Stripe.PaymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntent.id);
    // Confirm the payment by updating the Payment Intent status to 'succeeded'
    if (retrievedPaymentIntent.status !== "succeeded") {
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id
      );
      console.log(confirmedPaymentIntent);
    }
    return "Successfully billed by stripe";
  } catch (err) {
    throw new Error(err);
  }
};

export const handler = billCustomer;

/**
 * serverless logs -f billCustomer
 * serverless deploy function --function billCustomer
 */

//  curl https://api.stripe.com/v1/tokens \
//  -u : \
//  -d "card[number]"=4242424242424242 \
//  -d "card[exp_month]"=5 \
//  -d "card[exp_year]"=2024 \
//  -d "card[cvc]"=314

// {
//   "auctionId": "2997905a-e700-4797-88ac-d2208171ee98",
//   "quantity": 4,
//   "email": "sehrishwaheed98@gmail.com",
//   "redeem": true,
//   "token": "tok_1N6607AdvemoYxG95jkHofsa"
// }
