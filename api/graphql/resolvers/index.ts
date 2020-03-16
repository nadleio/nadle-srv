import * as path from "path";
import { fileLoader, mergeResolvers } from "merge-graphql-schemas";
const { Authorization } = require("../middlewares/authorization");

import dotenv = require("dotenv");
dotenv.config();

const resolvers = fileLoader(path.join(__dirname, "./**/*.resolvers.ts"));
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
    createPost: Authorization,
    followTag: Authorization,
    unfollowTag: Authorization
  }
};
