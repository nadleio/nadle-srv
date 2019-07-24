const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../../generated/prisma-client');

const secret: string = process.env.SECRET;

const login = async (email: string, password: string) => {
  const user = await prisma.user({ email: email })
  const isMatch = await bcrypt.compare(password, user.password)
  if (isMatch) {
    const now = new Date();
    const oneWeekForward = now.getDate() + 7;
    const token = await jwt.sign({ userId: user.id, validUntil: oneWeekForward }, secret);
    return {
      token: token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
    }};
  }
  return {};
}

export default {
  Query: {
    show: (_, {user}) => {
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }
    }
  },

  Mutation: {
    login: async (_, {email, password}) => {
      return await login(email, password)
    },
    signup: async (_, {email, password, first_name, last_name}) => {
      const hashedPassword = await bcrypt.hash(password, 10)
      const newUser = await prisma.createUser({
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashedPassword
      })
      return await login(email, password)
    }
  }
}
