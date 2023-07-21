import { gql } from "graphql-tag";

const typeDefs = gql`
  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each

  type Post {
    _id: ID!
    content: String!
    image: Image
    postedBy: User
  }

  type Query {
    allPosts(page: Int): [Post!]!
    postsByUser: [Post!]!
    singlePost(postId: String!): Post!
    totalPosts: Int!
    search(query: String): [Post]
  }

  input PostCreateInput {
    content: String!
    image: ImageInput
  }

  input PostUpdateInput {
    _id: String!
    content: String!
    image: ImageInput
  }

  # from frontend u will pass input variable that cobtains
  # all these values
  # pass values as values of input variable
  # standard way of passing variables to mutations
  type Mutation {
    postCreate(input: PostCreateInput!): Post!
    postUpdate(input: PostUpdateInput!): Post!
    postDelete(postId: String!): Post!
  }

  type Subscription {
    postAdded: Post
    postUpdated: Post
    postDeleted: Post
  }
`;

export default typeDefs;
