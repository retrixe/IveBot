// Set up resolvers.
export default {
  // Queries.
  Query: {
    // Warns of user.
    allWarnsOfUser: (parent, args, ctx, info) => ctx.db.query.warningDiscords({
      where: {}
    }, info)
  }
}
