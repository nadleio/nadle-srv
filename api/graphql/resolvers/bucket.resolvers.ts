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
    level(parent) {
      const childsArray = parent.childs
      return childsArray !== undefined ? childsArray.length : 0
    }
  }
}
