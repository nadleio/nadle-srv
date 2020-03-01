const sendgridToken = process.env.SENDGRID_API_KEY;
const secret = process.env.SECRET;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { processUpload } = require("../../modules/fileApi");
const { addSearchablePost } = require("../../modules/util");
const moment = require("moment");

module.exports = {
  Query: {
    getSelf: async (_, { user }) => {
      let data = {
        success: true,
        message: "Retriving user information",
        errorCode: null,
        data: parseUser(user)
      };
      return data;
    }
  },

  Mutation: {
    login: async (_, { identifier, password }) => {
      try {
        return await login(identifier, password);
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("USER", e)
        };
      }
    },
    signup: async (_, { email, username, password }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.createUser({
          email: email,
          username: username,
          password: hashedPassword
        });
        sendVerification(user);
        return { message: "User created", success: true };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("USER", e)
        };
      }
    },
    updateInfo: async (
      _,
      { user, firstName, lastName, biography, link, latitude, longitude }
    ) => {
      try {
        if (firstName !== undefined) {
          user.firstName = firstName;
        }
        if (lastName !== undefined) {
          user.lastName = lastName;
        }
        if (biography !== undefined) {
          user.biography = biography;
        }
        if (link !== undefined) {
          user.link = link;
        }
        if (latitude !== undefined) {
          user.latitude = latitude;
        }
        if (longitude !== undefined) {
          user.longitude = longitude;
        }

        let updateInput = parseUser(user);
        delete updateInput["id"];
        await prisma.updateUser({ data: updateInput, where: { id: user.id } });

        let data = {
          success: true,
          message: "Retriving user information",
          errorCode: null,
          data: parseUser(user)
        };
        return data;
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("USER", e)
        };
      }
    },
    verify: async (_, { token }) => {
      return await jwt.verify(token, secret, async (err, decodedToken) => {
        if (err || !decodedToken) {
          return { message: "User not verified", success: false };
        }
        const now = new Date();
        if (decodedToken.validUntil > now) {
          return { message: "Token expired", success: false };
        }
        await prisma.updateUser({
          data: { activatedAt: new Date() },
          where: { id: decodedToken.userId }
        });
        return { message: "User verified", success: true };
      });
    },
    forgotPassword: async (_, { email }) => {
      const user = await prisma.user({ email: email });
      if (user !== null) {
        SendPasswordChange(user);
        return { message: "User password change request sent", success: true };
      } else {
        return {
          message: "User password change request not sent",
          success: false,
          errorCode: "USER-E82ADBA"
        };
      }
    },
    changePassword: async (_, { token, newPassword }) => {
      return await jwt.verify(token, secret, async (err, decodedToken) => {
        if (err || !decodedToken) {
          return { message: "Token not valid", success: false };
        }
        const now = new Date();
        if (decodedToken.validUntil > now) {
          return { message: "Token expired", success: false };
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.updateUser({
          data: { password: hashedPassword },
          where: { id: decodedToken.userId }
        });
        return { message: "Password changed", success: true };
      });
    },
    changePasswordAuth: async (_, { user, oldPassword, newPassword }) => {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.updateUser({
          data: { password: hashedPassword },
          where: { id: user.id }
        });
        return { message: "Password changed", success: true };
      } else {
        return { message: "Password not changed", success: false };
      }
    },
    changeAvatar: async (_, { user, file }, ctx, info) => {
      try {
        let s3Data = await processUpload(await file, ctx);
        await prisma.updateUser({
          data: { avatar: s3Data.url },
          where: { id: user.id }
        });
        return {
          message: "Avatar image uploaded",
          success: true,
          data: parseUser(user)
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("AVATAR", e)
        };
      }
    },
    removeAvatar: async (_, { user }) => {
      try {
        await prisma.updateUser({
          data: { avatar: null },
          where: { id: user.id }
        });
        return {
          message: "Avatar image removed",
          success: true,
          data: parseUser(user)
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("AVATAR", e)
        };
      }
    },
    uploadFile: async (_, { user, file }, ctx, info) => {
      try {
        let s3Data = await processUpload(await file, ctx);
        let fileData = await prisma.createFile({
          url: s3Data.url,
          owner: { connect: { id: user.id } },
          fileName: s3Data.filename,
          mimetype: s3Data.mimetype,
          encoding: s3Data.encoding
        });
        return {
          message: "File Uploaded",
          success: true,
          data: fileData
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("FILE", e)
        };
      }
    },

    // User buckets
    createBucket: async (
      _,
      { user, parent, title, description, privateBucket }
    ) => {
      try {
        const parentBucketPresent = parent !== null;
        const bucket = await prisma.createBucket({
          parent: parentBucketPresent ? { connect: { id: parent } } : null,
          title: title,
          description: description,
          owner: { connect: { id: user.id } },
          privateBucket: privateBucket
        });
        return {
          message: "Bucket successfully created",
          success: true,
          data: bucket
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: "USER-0084",
          bucket: null
        };
      }
    },
    ////User's Post

    createPost: async (
      _,
      { body, title, coverPostUrl, user, organizationId }
    ) => {
      try {
        const post = await prisma.createPost({
          body: body,
          title: title,
          coverPostUrl: coverPostUrl,
          owner: { connect: { id: user.id } },
          organizationId: organizationId
        });
        addSearchablePost(post.id, title, body);
        return {
          message: "Post successfully created",
          success: true,
          data: parseUser(user)
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: "USER-0084",
          post: null
        };
      }
    }
  },

  User: {
    // User resolvers
    async buckets(parent) {
      return prisma.buckets({ where: { owner: { id: parent.id } } });
    },
    async posts(parent) {
      return prisma.posts({ where: { owner: { id: parent.id } } });
    },
    async followers(parent, { limit = 20, offset = 0 }) {
      let followers = await prisma.user({ id: parent.id }).followers();
      return {
        count: followers.length,
        pages: Math.ceil(followers.length / limit),
        results: followers.slice(offset, offset + limit)
      };
    },
    async following(parent, { limit = 20, offset = 0 }) {
      let following = await prisma.user({ id: parent.id }).following();
      return {
        count: following.length,
        pages: Math.ceil(following.length / limit),
        results: following.slice(offset, offset + limit)
      };
    },
    async files(parent, { limit = 20, offset = 0 }) {
      let files = await prisma.user({ id: parent.id }).files();
      return {
        count: files.length,
        pages: Math.ceil(files.length / limit),
        results: files.slice(offset, offset + limit)
      };
    }
  }
};

async function login(identifier, password) {
  const user =
    (await prisma.user({ email: identifier })) ||
    (await prisma.user({ username: identifier }));

  if (!user) {
    return {
      message: `User with the given identifier ${identifier} was not found`,
      success: false,
      data: null,
      errorCode: "USER-0002"
    };
  }

  if (!(moment(user.activatedAt) < moment()) || user.activatedAt === null) {
    return {
      message: "User hasn't been verified",
      success: false,
      data: null,
      errorCode: "USER-0003"
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    const oneWeekForward = moment().add(7, "d");
    const token = await jwt.sign(
      { userId: user.id, validUntil: oneWeekForward },
      secret
    );
    return {
      message: "User authenticated",
      success: true,
      data: {
        token: token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username
        }
      }
    };
  }
  return {
    message: "User not authenticated",
    success: false,
    data: null,
    errorCode: "USER-0001"
  };
}

async function sendVerification(user) {
  const sgMail = require("@sendgrid/mail");
  const now = moment();
  const oneDayForward = now.add(1, "d");
  const token = await jwt.sign(
    { userId: user.id, validUntil: oneDayForward },
    secret
  );
  await prisma.updateUser({
    data: { activationToken: token, activationSentAt: now },
    where: { id: user.id }
  });

  sgMail.setApiKey(sendgridToken);
  const msg = {
    to: user.email,
    from: "support@nadle.io",
    templateId: "d-cb170038c779464b9c1c21e7297280fe",
    dynamic_template_data: {
      token: token,
      first_name: user.firstName,
      last_name: user.lastName
    }
  };
  sgMail.send(msg);
}

async function SendPasswordChange(user) {
  const sgMail = require("@sendgrid/mail");
  const now = moment();
  const thirtyMinutesForward = now.add(30, "m");
  const token = await jwt.sign(
    { userId: user.id, validUntil: thirtyMinutesForward },
    secret
  );
  await prisma.updateUser({
    data: { resetPasswordToken: token, resetPasswordSentAt: now },
    where: { id: user.id }
  });

  sgMail.setApiKey(sendgridToken);
  const msg = {
    to: user.email,
    from: "support@nadle.io",
    templateId: "d-13beb537ddbe411993d903e6bab88b46",
    dynamic_template_data: {
      token: token,
      first_name: user.firstName,
      last_name: user.lastName
    }
  };
  sgMail.send(msg);
}

function parseUser(user) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    email: user.email,
    biography: user.biography,
    link: user.link,
    latitude: user.latitude,
    longitude: user.longitude
  };
}
