const { searchPost } = require("../../modules/util");

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
  }
};
