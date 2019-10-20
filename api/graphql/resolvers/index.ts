import * as path from "path";
import { fileLoader } from "merge-graphql-schemas";
const { Authorization } = require("../middlewares/authorization");

import dotenv = require("dotenv");
dotenv.config();

export const resolvers = fileLoader(path.join(__dirname, "./**/*.resolvers.*"));

export const permissions = {
  Query: {
    currentUser: Authorization,
    getSelf: Authorization
  },
  Mutation: {
    changePasswordAuth: Authorization,
    createBucket: Authorization
  }
};

String.prototype.hexEncode = function () {
  var hex, i;

  var result = "";
  for (i = 0; i < this.length; i++) {
    hex = this.charCodeAt(i).toString(16);
    result += (hex).slice(-4);
  }

  return result
}
