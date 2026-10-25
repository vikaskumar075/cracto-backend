export const typeDefs = `#graphql
  type Release {
    id: ID!
    name: String!
    date: String!
    status: String!
    additionalInfo: String
    stepsCompleted: [Int!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    releases: [Release!]!
    release(id: ID!): Release
  }

  type Mutation {
    createRelease(name: String!, date: String!, additionalInfo: String): Release!
    updateRelease(id: ID!, additionalInfo: String, stepsCompleted: [Int!]): Release!
    deleteRelease(id: ID!): Boolean!
  }
`;
