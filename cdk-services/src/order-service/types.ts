export interface TDetail {
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
}

export type TDetailType = "CheckoutBasket";
