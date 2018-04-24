// Import permission checks.
import { checkUserForPermission } from '../bot/imports/permissions'
// Import getServerSettings.
import { getServerSettings } from '../bot/imports/tools'
// Who's the host? He gets special permission.
import 'json5/lib/require'
const { host } = require('../config.json5')

// Set up resolvers.
export default (ctx) => ({
  // Queries.
  Query: {
    serverSettings: async (_, { serverId, linkToken }) => {
      if (
        checkUserForPermission(
          ctx.client, ctx.tempDB.link[linkToken], serverId, 'GENERAL_MANAGE_GUILD') ||
        host === ctx.tempDB.link[linkToken]
      ) return getServerSettings(ctx.db, serverId)
      else return { serverId: 'Forbidden.' }
    },
    getUserInfo: (_, { linkToken }) => {
      if (ctx.tempDB.link[linkToken]) {
        let servers = []
        Object.keys(ctx.client.servers).forEach(server => {
          Object.keys(ctx.client.servers[server].members).forEach(member => {
            if (member === ctx.tempDB.link[linkToken]) {
              servers.push({
                serverId: server,
                name: ctx.client.servers[server].name,
                icon: ctx.client.servers[server].icon || 'no icon',
                perms: checkUserForPermission(ctx.client, member, server, 'GENERAL_MANAGE_GUILD')
              })
            }
          })
        })
        return servers
      }
      return [{ serverId: 'Unavailable: invalid link token.', icon: 'no icon' }]
    }
  },
  Mutation: {
    editServerSettings: async (_, { serverId, linkToken, addRoleForAll }) => {
      if (
        checkUserForPermission(
          ctx.client, ctx.tempDB.link[linkToken], serverId, 'GENERAL_MANAGE_GUILD'
        ) || host === ctx.tempDB.link[linkToken]
      ) {
        await getServerSettings(ctx.db, serverId)
        await ctx.db.collection('servers').updateOne({ serverID: serverId }, { $set: {
          // eslint-disable-next-line no-unneeded-ternary
          addRoleForAll: addRoleForAll ? addRoleForAll : undefined
        } })
        return getServerSettings(ctx.db, serverId)
      } else return { serverId: 'Forbidden.' }
    }
  }
})
