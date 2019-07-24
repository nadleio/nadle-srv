const { prisma } = require('../../../generated/prisma-client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

import dotenv = require('dotenv');
dotenv.config();
const secret: any = process.env.SECRET;

export const Authorization = async (resolve, parent, args, ctx, info) => {
  let token = ctx.request.get('Authorization').split(' ')[1];
  await jwt.verify(token, secret, async (err: any, decodedToken: any) => {
    if (err || !decodedToken) {
      throw new Error(`Not authorised!`)
    }
    args.user = await prisma.user({ id: decodedToken.userId })
  })
  return resolve();
}
