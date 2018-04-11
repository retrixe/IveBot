// Import permission checks.
import { checkUserForPermission } from '../bot/imports/permissions'
// Import getServerSettings.
import { getServerSettings } from '../bot/imports/tools'
// Who's the host? He gets special permission.
import 'json5/lib/require'
const { host } = require('../config.json5')

// Set up resolvers.
export default {
  // Queries.
  Query: {
    serverSettings: (_, { serverId, linkToken }, ctx) => {
      if (
        checkUserForPermission(
          ctx.client, ctx.tempDB.link[linkToken], serverId, 'GENERAL_MANAGE_GUILD') ||
        host === ctx.tempDB.link[linkToken]
      ) return getServerSettings(ctx.db, serverId)
      else return { serverId: 'Forbidden.' }
    },
    getLinkUser: (_, { linkToken }, ctx) => {
      if (ctx.tempDB.link[linkToken]) {
        const b = JSON.parse(JSON.stringify(ctx.tempDB.link))
        ctx.tempDB.link[linkToken] = undefined
        let servers = []
        Object.keys(ctx.client.servers).forEach(server => {
          ctx.client.servers[server].members.forEach(member => {
            if (member === b[linkToken]) {
              servers.push({
                serverId: server,
                name: ctx.client.servers[server].name,
                icon: ctx.client.servers[server].icon,
                perms: checkUserForPermission(ctx.client, member, server, 'GENERAL_MANAGE_GUILD')
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
    editServerSettings: (_, { serverId, addRoleForAll }, ctx) => ctx.db.mutation.updateManyServerSettings(
      { data: { addRoleForAll, serverId }, where: { serverId } }
    ),
    initServerSettings: (_, { serverId }, ctx) => ctx.db.mutation.createServerSetting(
      { data: { serverId } }
    )
  }
}
