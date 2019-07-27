const { prisma } = require('../../../generated/prisma-client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

import dotenv = require('dotenv');
dotenv.config();
const secret: any = process.env.SECRET;

export const Authorization = async (resolve: any, parent: any, args: any, ctx: any, info: any) => {
  let token = ctx.request.get('Authorization').split(' ')[1];
  await jwt.verify(token, secret, async (err: any, decodedToken: any) => {
    if (err || !decodedToken) {
      throw new Error(`Not authorised!`)
    }
    args.user = await prisma.user({ id: decodedToken.userId })
  })
  return resolve();
}