import { IStepFunction } from "../types";

export const handler = async (event: IStepFunction) => {
  const newBasket = {
    ...event.resultGetBasketOfUserFunctionResult.Payload.basket,
    totalPrice: 0,
  };

  const basket = event.resultGetBasketOfUserFunctionResult?.Payload?.basket;

  try {
    if (basket === null || basket.items?.length === 0) {
      let BasketEmptyError = new Error("Basket has no items");
      BasketEmptyError.name = "BasketEmpty";
      throw BasketEmptyError;
    }

    let totalPrice = 0;
    basket.items.forEach((item) => (totalPrice = totalPrice + item.price));
    newBasket.totalPrice = +totalPrice.toFixed(2);

    // copy all objects from basket to newBasket
    Object.assign(newBasket, basket);

    return {
      newBasket,
    };
  } catch (e) {
    const err = e as Error;
    console.log(err);

    if (err.name === "BasketEmpty") {
      throw err;
    } else {
      let basketServerError = new Error("Server Error");
      basketServerError.name = "BasketServerError";
      throw basketServerError;
    }
  }
};
