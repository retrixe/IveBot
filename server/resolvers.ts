// Import permission checks and function to retrieve server settings.
import { checkUserForPermission } from '../bot/imports/permissions'
import { getServerSettings } from '../bot/imports/tools'
// Get types.
import { mongoDB } from '../bot/imports/types'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Who's the host? He gets special permission.
import 'json5/lib/require'
const { host, mongoURL } = require('../config.json5')

// Create a MongoDB instance.
let db: mongoDB
MongoClient.connect(mongoURL === 'dotenv' ? process.env.MONGO_URL : mongoURL, (err, client) => {
  if (err) throw new Error('Error:\n' + err)
  console.log('GraphQL server connected successfully to MongoDB.')
  db = client.db('ivebot')
})

// Set up resolvers.
export default (ctx) => ({
  // Queries.
  Query: {
    serverSettings: async (_, { serverId, linkToken }) => {
      const { addRoleForAll } = await getServerSettings(db, serverId)
      if (
        checkUserForPermission(
          ctx.client, ctx.tempDB.link[linkToken], serverId, 'GENERAL_MANAGE_GUILD') ||
        host === ctx.tempDB.link[linkToken]
      ) return { serverId, addRoleForAll }
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
                perms: host === ctx.tempDB.link[linkToken]
                  ? true
                  : checkUserForPermission(ctx.client, member, server, 'GENERAL_MANAGE_GUILD')
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
    editServerSettings: async (_, { input }) => {
      const { serverId, linkToken, addRoleForAll } = input
      if (
        checkUserForPermission(
          ctx.client, ctx.tempDB.link[linkToken], serverId, 'GENERAL_MANAGE_GUILD'
        ) || host === ctx.tempDB.link[linkToken]
      ) {
        await getServerSettings(db, serverId)
        await db.collection('servers').updateOne({ serverID: serverId }, { $set: {
          // eslint-disable-next-line no-unneeded-ternary
          addRoleForAll: addRoleForAll ? addRoleForAll : undefined
        } })
        return getServerSettings(db, serverId)
      } else return { serverId: 'Forbidden.' }
    }
  }
})
