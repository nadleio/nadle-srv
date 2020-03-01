import * as path from "path";
import { fileLoader, mergeResolvers } from "merge-graphql-schemas";
const { Authorization } = require("../middlewares/authorization");

import dotenv = require("dotenv");
dotenv.config();

global.structureError = (ctx, error) => {
  return `${ctx}-${error.message
    .hexEncode()
    .slice(-7)
    .toUpperCase()}`;
};

const resolvers = fileLoader(path.join(__dirname, "./**/*.resolvers.*"));
export default mergeResolvers(resolvers);

export const permissions = {
  Query: {
    getSelf: Authorization
  },
  Mutation: {
    changePasswordAuth: Authorization,
    createBucket: Authorization,
    removeAvatar: Authorization,
    changeAvatar: Authorization,
    uploadFile: Authorization,
    updateInfo: Authorization,
    createPost: Authorization
  }
};

declare global {
  interface String {
    hexEncode(): string;
  }
}

String.prototype.hexEncode = function() {
  var hex, i;

  var result = "";
  for (i = 0; i < this.length; i++) {
    hex = this.charCodeAt(i).toString(16);
    result += hex.slice(-4);
  }

  return result;
};
