module.exports = {
  Mutation: {
    createBucket: async (
      _,
      { user, parent, title, description, privateBucket }
    ) => {
      try {
        const parentBucketPresent = parent !== null;
        const bucket = await global.prisma.createBucket({
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
          errorCode: global.structureError("BUCKET-CREATE", e),
          bucket: null
        };
      }
    }
  },

  Bucket: {
    parent(parent) {
      return global.prisma.bucket({ id: parent.id }).parent();
    },
    owner(parent) {
      return global.prisma.bucket({ id: parent.id }).owner();
    },
    childs(parent) {
      return global.prisma.buckets({ where: { parent: { id: parent.id } } });
    },
    async level(parent) {
      let deepness = 0;
      const childsArray = await global.prisma.buckets({
        where: { parent: { id: parent.id } }
      });
      for (var i = 0; i < childsArray.length; i++) {
        console.log(childsArray);
        deepness =
          1 +
          ((await global.prisma.bucket({ id: childsArray[i].id })["level"]) ||
            0);
      }

      return deepness;
    }
  }
};
