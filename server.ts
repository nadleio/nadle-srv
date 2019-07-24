
import express = require('express');
import dotenv = require('dotenv');
import bodyParser = require("body-parser");
import { default as typeDefs } from './api/graphql/typeDefs'
import { resolvers, permissions } from './api/graphql/resolvers'
import { GraphQLServer } from 'graphql-yoga'

console.log(permissions)

dotenv.config();

const app: express.Application = express();
const graphql: GraphQLServer = new GraphQLServer({
  typeDefs,
  resolvers,
  port: portGraphql,
  context: req => ({ ...req }),
  middlewares: [permissions]
})

const portApi: string = process.env.PORT || '3000';
const portGraphql: string = process.env.GRAPHQL_PORT || '4000';

const usersRouter = require('./api/routers/users')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/users', usersRouter);

app.listen(portApi, () => console.log(`Api listening ⚡ on port: ${portApi}`));
graphql.start(() => console.log(`Graphql listening ⚡ on port: ${portGraphql}`));
