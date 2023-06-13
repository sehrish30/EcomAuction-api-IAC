export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  AWSDate: string;
  AWSDateTime: string;
  AWSEmail: string;
  AWSIPAddress: string;
  AWSJSON: string;
  AWSPhone: string;
  AWSTime: string;
  AWSTimestamp: number;
  AWSURL: string;
};

export type Book = {
  __typename?: 'Book';
  author: Scalars['String'];
  bookId: Scalars['ID'];
  createdAt?: Maybe<Scalars['AWSDateTime']>;
  description?: Maybe<Scalars['String']>;
  imageUrl?: Maybe<Scalars['AWSURL']>;
  price: Scalars['Float'];
  title: Scalars['String'];
  updatedAt?: Maybe<Scalars['AWSDateTime']>;
};

export type BookInput = {
  author: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  imageUrl?: InputMaybe<Scalars['AWSURL']>;
  price: Scalars['Float'];
  title: Scalars['String'];
};

export type BooksPage = {
  __typename?: 'BooksPage';
  books?: Maybe<Array<Maybe<Book>>>;
  nextToken?: Maybe<NextToken>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createBook: Book;
  createOrder: Scalars['Boolean'];
};


export type MutationCreateBookArgs = {
  newBook?: InputMaybe<BookInput>;
};


export type MutationCreateOrderArgs = {
  newOrder?: InputMaybe<OrderInput>;
};

export type NextToken = {
  __typename?: 'NextToken';
  bookId?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['String']>;
  price?: Maybe<Scalars['Float']>;
};

export type OrderInput = {
  items?: InputMaybe<Array<InputMaybe<OrderItemInput>>>;
};

export type OrderItem = {
  __typename?: 'OrderItem';
  book: Book;
  orderId: Scalars['ID'];
  quantity: Scalars['Int'];
  userId: Scalars['ID'];
};

export type OrderItemInput = {
  bookId: Scalars['ID'];
  quantity: Scalars['Int'];
};

export type OrderItemsPage = {
  __typename?: 'OrderItemsPage';
  OrderItems?: Maybe<Array<Maybe<OrderItem>>>;
  nextToken?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  getBookById: Book;
  listBooks: BooksPage;
  myOrders: OrderItemsPage;
};


export type QueryGetBookByIdArgs = {
  bookId: Scalars['ID'];
};


export type QueryListBooksArgs = {
  limit: Scalars['Int'];
  nextBookId?: InputMaybe<Scalars['String']>;
  nextCreatedAt?: InputMaybe<Scalars['String']>;
  nextPrice?: InputMaybe<Scalars['Float']>;
};


export type QueryMyOrdersArgs = {
  limit: Scalars['Int'];
  nextToken?: InputMaybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  onCreateBook?: Maybe<Book>;
};
