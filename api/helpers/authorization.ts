import * as jwt from "jsonwebtoken";
const Cookies = require('cookies');
const { prisma } = require('../../generated/prisma-client')

const secret: any = process.env.SECRET;

const Authorization = async function (req: any, res: any, next: any) {
  const cookies = new Cookies(req, res);
  let authorization: string = req.headers.authorization || cookies.get('token');
  authorization = decodeURIComponent(authorization).split(' ')[1];
  console.log(authorization)
  await jwt.verify(authorization, secret, async (err: any, decodedToken: any) => {
    if (err || !decodedToken) {
      res.status(401).send('not authorized')
      return
    }
    req.user = await prisma.user({ id: decodedToken.userId })
    next()
  })
}

export default Authorization;