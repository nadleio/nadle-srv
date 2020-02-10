import dotenv = require("dotenv");
import { default as typeDefs } from "./api/graphql/typeDefs";
import { resolvers, permissions } from "./api/graphql/resolvers";
import { GraphQLServer } from "graphql-yoga";

dotenv.config();
const portGraphql: string = process.env.PORT || "4000";

const graphql: GraphQLServer = new GraphQLServer({
  typeDefs,
  resolvers: resolvers as any,
  context: req => ({ ...req }),
  middlewares: [permissions]
});

var bonsai_url = process.env.BONSAI_URL;
var elasticsearch = require("elasticsearch");
var client = new elasticsearch.Client({
  host: bonsai_url,
  log: "trace"
});

// Test the connection:
// Send a HEAD request to "/" and allow
// up to 30 seconds for it to complete.
client.ping(
  {
    requestTimeout: 30000
  },
  function(error) {
    if (error) {
      console.error("elasticsearch cluster is down!");
    } else {
      console.log("All is well");
    }
  }
);

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
