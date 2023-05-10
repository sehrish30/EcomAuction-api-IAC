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

// old method
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
    payment_method: "",
    confirm: true, // Set to `true` to immediately confirm and capture the payment
  });
};

const createNewPaymentIntent = async (
  amount: number,
  currency: "usd",
  customer: string
) => {
  const paymentIntent: Stripe.Response<Stripe.PaymentIntent> =
    await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: "pm_card_visa", // testing use pm_card_visa instead of card number
      // customer,
    });
  return paymentIntent;
};

const billCustomer = async ({ total, email, token }: BillCustomerType) => {
  // bill the customer call stripe
  // from frontend u can pass along stripe token
  // and inject it into state machine
  let confirmedPaymentIntent;
  console.log({ billCustomer: total, token });
  try {
    // Create a Payment Intent for customer
    const paymentIntent = await createNewPaymentIntent(
      total.total,
      "usd",
      email
    );

    // Retrieve the Payment Intent
    const retrievedPaymentIntent: Stripe.PaymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntent.id, {
        expand: ["charges.data.balance_transaction"],
      });

    // Confirm the payment by updating the Payment Intent status to 'succeeded'
    if (retrievedPaymentIntent.status !== "succeeded") {
      confirmedPaymentIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id
      );
      // Retrieve the Charge object for the PaymentIntent
      console.log({ confirmedPaymentIntent });
    }
    return {
      message: "Successfully billed by stripe",
      chargeId: confirmedPaymentIntent.latest_charge,
    };
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
//  -u sk_test_your_key: \
//  -d "card[number]"=4242424242424242 \
//  -d "card[exp_month]"=5 \
//  -d "card[exp_year]"=2024 \
//  -d "card[cvc]"=232

// {
//   "auctionId": "2997905a-e700-4797-88ac-d2208171ee98",
//   "quantity": 4,
//   "email": "sehrish@gmail.com",
//   "redeem": true,
// }

// curl https://api.stripe.com/v1/payment_intents \
//   -u "sk_test_your_key:" \
//   -d amount=500 \
//   -d currency=gbp \
//   -d payment_method=pm_card_visa
