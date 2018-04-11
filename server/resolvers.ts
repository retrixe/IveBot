// Import permission checks.
import { checkUserForPermission } from '../bot/imports/permissions'

// Set up resolvers.
export default (tempDB, client) => ({
  // Queries.
  Query: {
    // Warns of user.
    allWarnsOfUser: (parent, { userId, serverId }, ctx, info) => ctx.db.query.warningDiscords({
      where: { warnedId: userId, serverId }
    }, info),
    serverSettings: (parent, { serverId }, ctx, info) => ctx.db.query.serverSettings({
      where: { serverId }
    }, info),
    getLinkUser: (parent, { linkToken }) => {
      if (tempDB.link[linkToken]) {
        const b = JSON.parse(JSON.stringify(tempDB.link))
        tempDB.link[linkToken] = undefined
        let servers = []
        Object.keys(client.servers).forEach(server => {
          client.servers[server].members.forEach(member => {
            if (member === b[linkToken]) {
              servers.push({
                serverId: server,
                icon: client.servers[server].icon,
                perms: checkUserForPermission(client, member, server, 'GENERAL_MANAGE_GUILD')
              })
            }
          })
        })
        return { userId: b[linkToken], servers }
      }
      return { userId: 'Could not verify token.' }
    }
  },
  Mutation: {
    warn: (parent, {warnedId, warnerId, reason, serverId}, ctx, info) => ctx.db.mutation.createWarningDiscord(
      { data: { warnedId, warnerId, reason, date: new Date().toUTCString(), serverId } },
      info
    ),
    clearWarns: (parent, { userId, serverId }, ctx, info) => ctx.db.mutation.deleteManyWarningDiscords(
      { where: { userId, serverId } },
      info
    ),
    editServerSettings: (parent, { serverId, addRoleForAll }, ctx, info) => ctx.db.mutation.updateManyServerSettings(
      { data: { addRoleForAll, serverId }, where: { serverId } },
      info
    ),
    initServerSettings: (parent, { serverId }, ctx, info) => ctx.db.mutation.createServerSetting(
      { data: { serverId } },
      info
    )
  }
})
