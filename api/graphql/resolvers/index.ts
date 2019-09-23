import * as path from 'path';
import { fileLoader } from 'merge-graphql-schemas';
const { Authorization } = require('../middlewares/authorization');


import dotenv = require('dotenv');
dotenv.config();

export const resolvers = fileLoader(path.join(__dirname, './**/*.resolvers.*'))

export const permissions = {
  Query: {
    currentUser: Authorization
  },
  Mutation: {
    changePasswordAuth: Authorization,
    createBucket: Authorization
  }
}
