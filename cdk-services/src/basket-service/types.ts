export interface IProduct {
  name: string;
  price: number;
  category: string;
  description: string;
  imageFile: string;
  quantity: number;
  id: string;
}

export interface IBasket {
  userName: string;
  items: IProduct[];
  totalPrice?: number;
}

export interface IStepFunction {
  body: {
    userName: string;
    totalPrice: number;
    firstName: string;
    lastName: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    cardInfo: string;
    paymentMethod: string;
    id: string;
    items: any[][];
    orderDate?: string;
  };
  resultGetBasketOfUserFunctionResult: {
    Payload: {
      basket: IBasket;
    };
  };
  resultPrepareOrderFunctionResult: {
    Payload: {
      newBasket: IBasket;
    };
  };
  validationCheckFunctionResult: {
    Payload: {
      status: string;
    };
  };
  checkoutPublishEventFunctionResult: {
    Payload: {
      result: string;
    };
  };
  RemoveTotalPriceFunctionResult: {
    Payload: {
      result: string;
    };
  };
}
