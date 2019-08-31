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
        first_name: user.first_name,
        last_name: user.last_name,
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
  await prisma.updateUser({ data: { activation_token: token, activation_sent_at: now }, where: { id: user.id } })

  sgMail.setApiKey(sendgridToken);
  const msg = {
    to: user.email,
    from: 'support@nadle.io',
    templateId: 'd-cb170038c779464b9c1c21e7297280fe',
    dynamic_template_data: {
      token: token,
      first_name: user.first_name,
      last_name: user.last_name
    },
  };
  sgMail.send(msg);
}

module.exports = {
  Query: {
    current_user: (_, { user }) => {
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }
    }
  },

  Mutation: {
    login: async (_, { email, password }) => {
      return await login(email, password)
    },
    signup: async (_, { email, password, first_name, last_name }) => {
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.createUser({
        first_name: first_name,
        last_name: last_name,
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
        await prisma.updateUser({ data: { activated_at: new Date() }, where: { id: decodedToken.userId } })
        return { message: "User verified", success: true }
      })
    }
  }
}
