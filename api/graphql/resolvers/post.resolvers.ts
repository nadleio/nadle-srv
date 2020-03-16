const { searchPost } = require("../../modules/util");
const { addSearchablePost } = require("../../modules/util");

const processHashTags = (body: string): void => {
  let regexp = /\B\#\w\w+\b/g;
  let result = body.match(regexp);
  if (result == null) return;
  result.forEach(hashtag => {
    global.hashTagHandler.countUse(hashtag);
  });
};

module.exports = {
  Query: {
    getPost: async (_, { query, limit = 20, offset = 0 }) => {
      try {
        const values = await searchPost(query, limit, offset);
        return {
          message: "Post search results",
          success: true,
          errorCode: null,
          data: {
            count: values.hits.total.value,
            pages: Math.ceil(values.hits.total.value / limit),
            results: await global.prisma.posts({
              where: { id_in: values.hits.hits.map(result => result._id) }
            })
          }
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("POST-SEARCH", e)
        };
      }
    }
  },
  Mutation: {
    createPost: async (
      _,
      { body, title, coverPostUrl, user, organizationId }
    ) => {
      try {
        processHashTags(body);
        const post = await global.prisma.createPost({
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
          data: global.parseUser(user)
        };
      } catch (e) {
        return {
          message: e.message,
          success: false,
          errorCode: global.structureError("POST-CREATE", e),
          post: null
        };
      }
    }
  }
};
