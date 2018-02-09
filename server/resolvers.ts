// Set up resolvers.
export default {
  // Queries.
  Query: {
    // Warns of user.
    allWarnsOfUser: (parent, { userId }, ctx, info) => ctx.db.query.warningDiscords({
      where: { warnedId: userId }
    }, info)
  },
  Mutation: {
    warn: (parent, {warnedId, warnerId, reason}, ctx, info) => ctx.db.mutation.createWarningDiscord(
      { data: { warnedId, warnerId, reason, date: new Date().toUTCString() } },
      info
    )
  }
}
