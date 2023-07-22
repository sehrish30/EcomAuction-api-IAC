"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = require("graphql-tag");
const typeDefs = (0, graphql_tag_1.gql) `
  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each

  # import { DateTime } from 'graphql-scalars';

  # Add the custom scalar type resolver to your server's resolver map.
  # The resolver function should handle the serialization and deserialization of the custom scalar values.
  # You can import the resolver function
  #  from graphql-scalars and add it to your resolver map like this in your resolover file
  # import { DateTimeResolver } from 'graphql-scalars';
  # DateTime: DateTimeResolver,
  scalar DateTime

  type User {
    _id: ID!
    username: String
    name: String
    email: String
    images: [Image]
    about: String
    createdAt: DateTime
    updatedAt: DateTime
  }

  type Query {
    profile: User!
    publicProfile(username: String!): User!
    allUsers: [User!]
  }

  # custom type
  type UserCreateResponse {
    username: String!
    email: String!
  }

  type Image {
    url: String
    public_id: String
  }

  input ImageInput {
    url: String
    public_id: String
  }
  # input type
  input UserUpdateInput {
    username: String
    email: String
    name: String
    images: [ImageInput]
    about: String
  }

  type Mutation {
    userCreate: UserCreateResponse!
    userUpdate(input: UserUpdateInput): User!
  }
`;
exports.default = typeDefs;
