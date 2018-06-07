// Import permission checks and function to retrieve server settings.
import { getServerSettings } from './bot/imports/tools'
// Get types.
import { mongoDB, DB, client } from './bot/imports/types'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Who's the host? He gets special permission.
import 'json5/lib/require'
import { host, mongoURL } from '../config.json5'

// Create a MongoDB instance.
let db: mongoDB
MongoClient.connect(mongoURL === 'dotenv' ? process.env.MONGO_URL : mongoURL, (err, client) => {
  if (err) throw new Error('Error:\n' + err)
  console.log('GraphQL server connected successfully to MongoDB.')
  db = client.db('ivebot')
})

// Set up resolvers.
export default (ctx: { tempDB: DB, client: client }) => ({
  // Queries.
  Query: {
    serverSettings: async (
      _: string, { serverId, linkToken }: { serverId: string, linkToken: string }
    ) => {
      const member = ctx.client.guilds
        .find(t => t.id === serverId).members.find(t => t.id === ctx.tempDB.link[linkToken])
      let {
        addRoleForAll, joinLeaveMessages, joinAutorole
      } = await getServerSettings(db, serverId)
      if (
        member.permission.has('manageGuild') || host === ctx.tempDB.link[linkToken]
      ) return { serverId, addRoleForAll, joinLeaveMessages, joinAutorole }
      else return { serverId: 'Forbidden.' }
    },
    getUserInfo: (_: string, { linkToken }: { linkToken: string }) => {
      if (ctx.tempDB.link[linkToken]) {
        let servers: Array<{ perms: boolean, icon: string, serverId: string, name: string }> = []
        ctx.client.guilds.forEach(server => {
          ctx.client.guilds.find(a => a.id === server.id).members.forEach(member => {
            if (member.id === ctx.tempDB.link[linkToken]) {
              servers.push({
                serverId: server.id,
                name: server.name,
                icon: server.iconURL || 'no icon',
                perms: host === ctx.tempDB.link[linkToken]
                  ? true : member.permission.has('manageGuild')
              })
            }
          })
        })
        return servers
      }
      return [{ serverId: 'Unavailable: invalid link token.', icon: 'no icon' }]
    },
    getBotId: () => ctx.client.user.id
  },
  Mutation: {
    editServerSettings: async (
      _: string, { input }: { input: { // eslint-disable-next-line indent
        serverId: string, linkToken: string, addRoleForAll: string, joinAutorole: string
      } }
    ) => {
      const { serverId, linkToken, addRoleForAll, joinAutorole } = input
      const member = ctx.client.guilds
        .find(t => t.id === serverId).members.find(t => t.id === ctx.tempDB.link[linkToken])
      if (
        member.permission.has('manageGuild') || host === ctx.tempDB.link[linkToken]
      ) {
        await getServerSettings(db, serverId)
        await db.collection('servers').updateOne({ serverID: serverId }, { $set: {
          /* eslint-disable no-unneeded-ternary */
          addRoleForAll: addRoleForAll ? addRoleForAll : undefined,
          joinAutorole: joinAutorole ? joinAutorole : undefined
          /* eslint-enable no-unneeded-ternary */
        } })
        return getServerSettings(db, serverId)
      } else return { serverId: 'Forbidden.' }
    }
  }
})
