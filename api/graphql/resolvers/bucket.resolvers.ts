import { prisma } from "../../../generated/prisma-client"

module.exports = {
  Bucket: {
    parent(parent) {
      return prisma.bucket({ id: parent.id }).parent()
    },
    owner(parent) {
      return prisma.bucket({ id: parent.id }).owner()
    },
    childs(parent) {
      return prisma.buckets({ where: { parent: { id: parent.id } } })
    },
    async level(parent) {
      let deepness = 0
      const childsArray = await prisma.buckets({ where: { parent: { id: parent.id } } })
      for (var i = 0; i < childsArray.length; i++) {
        console.log(childsArray)
        deepness = 1 + (await prisma.bucket({ id: childsArray[i].id })['level'] || 0)
      }

      return deepness
    }
  }
}
