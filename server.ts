import express from 'express';
import dotenv = require('dotenv');
import bodyParser = require("body-parser");
import { default as typeDefs } from './api/graphql/typeDefs'
import { resolvers, permissions } from './api/graphql/resolvers'
import { GraphQLServer, Options } from 'graphql-yoga'

dotenv.config();
const portGraphql: string = process.env.GRAPHQL_PORT || '4000';
const portApi: string = process.env.PORT || '3000';

const app: express.Application = express();
const graphql: GraphQLServer = new GraphQLServer({
  typeDefs,
  resolvers: (resolvers as any),
  context: req => ({ ...req }),
  middlewares: [permissions]
})


const usersRouter = require('./api/routers/users')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/users', usersRouter);

app.listen(portApi, () => console.log(`Api listening ⚡ on port: ${portApi}`));
graphql.start(() => console.log(`Graphql listening ⚡ on port: ${portGraphql}`));

export default app;
