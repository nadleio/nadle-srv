const sendgridToken = process.env.SENDGRID_API_KEY;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../../generated/prisma-client');

const secret = process.env.SECRET;

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
        const now = new Date();
        if (decodedToken.validUntil > now) {
          return { message: "Token expired", success: false }
        }
        await prisma.updateUser({ data: { activatedAt: new Date() }, where: { id: decodedToken.userId } })
        return { message: "User verified", success: true }
      })
    },
    forgotPassword: async (_, { email }) => {
      const user = await prisma.user({ email: email })
      if (user !== null) {
        SendPasswordChange(user)
        return { message: "User password change request sent", success: true }
      } else {
        return { message: "User password change request not sent", success: false }
      }
    },
    changePassword: async (_, { token, newPassword }) => {
      return await jwt.verify(token, secret, async (err, decodedToken) => {
        if (err || !decodedToken) {
          return { message: "Token not valid", success: false }
        }
        const now = new Date();
        if (decodedToken.validUntil > now) {
          return { message: "Token expired", success: false }
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.updateUser({ data: { password: hashedPassword }, where: { id: decodedToken.userId } })
        return { message: "Password changed", success: true }
      })
    },
    changePasswordAuth: async (_, { user, oldPassword, newPassword }) => {
      const isMatch = await bcrypt.compare(oldPassword, user.password)
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.updateUser({ data: { password: hashedPassword }, where: { id: user.id } })
        return { message: "Password changed", success: true }
      } else {
        return { message: "Password not changed", success: false }
      }
    },

    // User buckets
    createBucket: async (_, { user, parent, title, description, privateBucket }) => {
      try {
        const parentBucketPresent = parent !== null
        const bucket = await prisma.createBucket({
          parent: parentBucketPresent ? { connect: { id: parent } } : null,
          title: title,
          description: description,
          owner: { connect: { id: user.id } },
          privateBucket: privateBucket
        })
        return {
          message: 'Bucket successfully created',
          success: true,
          data: bucket
        }
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: "USER-0084",
          bucket: null
        }
      }
    }
  },

  User: {
    // User resolvers
    buckets(parent) {
      return prisma.buckets({ where: { owner: { id: parent.id } } })
    }
  }
}



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

async function SendPasswordChange(user) {
  const sgMail = require('@sendgrid/mail');
  const now = new Date();
  const thirtyMinutesForward = now.getMinutes() + 20;
  const token = await jwt.sign({ userId: user.id, validUntil: thirtyMinutesForward }, secret);
  await prisma.updateUser({ data: { resetPasswordToken: token, resetPasswordSentAt: now }, where: { id: user.id } })

  sgMail.setApiKey(sendgridToken);
  const msg = {
    to: user.email,
    from: 'support@nadle.io',
    templateId: 'd-13beb537ddbe411993d903e6bab88b46',
    dynamic_template_data: {
      token: token,
      first_name: user.firstName,
      last_name: user.lastName
    },
  };
  sgMail.send(msg);
}