import dotenv = require("dotenv");
import { default as typeDefs } from "./api/graphql/typeDefs";
import { default as resolvers, permissions } from "./api/graphql/resolvers";
import { GraphQLServer } from "graphql-yoga";

declare global {
  module NodeJS {
    interface Global {
      structureError: any;
    }
  }
}

dotenv.config();
const portGraphql: string = process.env.PORT || "4000";

const graphql: GraphQLServer = new GraphQLServer({
  typeDefs,
  resolvers: resolvers as any,
  context: req => ({ ...req }),
  middlewares: [permissions]
});

const options = {
  port: portGraphql,
  endpoint: "/graphql",
  subscriptions: "/subscriptions",
  playground: "/playground"
};

graphql.start(options, () =>
  console.log(`Graphql listening ⚡ on port: ${portGraphql}`)
);

export default graphql;
