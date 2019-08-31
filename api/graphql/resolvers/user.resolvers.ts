const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../../generated/prisma-client');

const secret = process.env.SECRET;
const sendgridToken = process.env.SENDGRID_API_KEY;

async function login(email, password) {
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    };
  }
  return {};
}

async function sendVerification(user) {
  const sgMail = require('@sendgrid/mail');
  const now = new Date();
  const oneDayForward = now.getDay() + 1;
  const token = await jwt.sign({ userId: user.id, validUntil: oneDayForward }, secret);
  await prisma.updateUser({ data: { activationToken: token, activationSentAt: now }, where: { id: user.id } })

  sgMail.setApiKey(sendgridToken);
  const msg = {
    to: user.email,
    from: 'support@nadle.io',
    templateId: 'd-cb170038c779464b9c1c21e7297280fe',
    dynamic_template_data: {
      token: token,
      first_name: user.firstName,
      last_name: user.lastName
    },
  };
  sgMail.send(msg);
}

module.exports = {
  Query: {
    currentUser: (_, { user }) => {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    }
  },

  Mutation: {
    login: async (_, { email, password }) => {
      return await login(email, password)
    },
    signup: async (_, { email, password, firstName, lastName }) => {
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.createUser({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword
      })
      sendVerification(user)
      return { message: "User created", success: true }
    },
    verify: async (_, { token }) => {
      return await jwt.verify(token, secret, async (err, decodedToken) => {
        if (err || !decodedToken) {
          return { message: "User not verified", success: false }
        }
        await prisma.updateUser({ data: { activatedAt: new Date() }, where: { id: decodedToken.userId } })
        return { message: "User verified", success: true }
      })
    }
  }
}
