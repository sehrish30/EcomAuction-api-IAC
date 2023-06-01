import { EventBridgeEvent } from "aws-lambda";

interface TDetail {
  userName: string;
  basket: number;
}

type TDetailType = "CheckoutBasket";

export const handler = async (
  event: EventBridgeEvent<TDetailType, TDetail>
) => {
  console.log(event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "YEAH",
    }),
  };
};
