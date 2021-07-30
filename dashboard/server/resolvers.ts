// Import permission checks and function to retrieve server settings.
import { getServerSettings } from './bot/imports/tools'
// Get types.
import { DB } from './bot/imports/types'
import { Client } from 'eris'
// Get MongoDB.
import { MongoClient, Db } from 'mongodb'
// Who's the host? He gets special permission.
import 'json5/lib/require'
import { host, mongoURL } from '../config.json5'

// Create a MongoDB instance.
let db: Db
MongoClient.connect(mongoURL === 'dotenv' ? process.env.MONGO_URL : mongoURL, (err, client) => {
  if (err) throw new Error('Error:\n' + err)
  console.log('GraphQL server connected successfully to MongoDB.')
  db = client.db('ivebot')
})

// A constant.
const api = 'https://discordapp.com/api/v7'

// Set up resolvers.
export default (ctx: { tempDB: DB, client: Client }) => ({
  // Queries.
  Query: {
    serverSettings: async (
      _: string, { serverId, linkToken }: { serverId: string, linkToken: string }
    ) => {
      const member = ctx.client.guilds
        .find(t => t.id === serverId).members.get(ctx.tempDB.link[linkToken])
      let {
        addRoleForAll, joinLeaveMessages, joinAutorole, ocrOnSend
      } = await getServerSettings(db, serverId)
      // Insert default values for all properties.
      joinLeaveMessages = joinLeaveMessages ? {
        channel: joinLeaveMessages.channel || '',
        joinMessage: joinLeaveMessages.joinMessage || '',
        leaveMessage: joinLeaveMessages.leaveMessage || '',
        banMessage: joinLeaveMessages.banMessage || ''
      } : { channel: '', joinMessage: '', leaveMessage: '', banMessage: '' }
      addRoleForAll = addRoleForAll || ''
      ocrOnSend = ocrOnSend || false
      joinAutorole = joinAutorole || ''
      // Check for permissions, and then send server settings.
      if (
        member && (member.permissions.has('manageGuild') || host === ctx.tempDB.link[linkToken])
      ) return { serverId, addRoleForAll, joinLeaveMessages, joinAutorole, ocrOnSend }
      else return { serverId: 'Forbidden.' }
    },
    // Get user info.
    getUserInfo: (_: string, { linkToken }: { linkToken: string }) => {
      if (ctx.tempDB.link[linkToken]) {
        let servers: Array<{
          perms: boolean, icon: string, serverId: string, name: string,
          channels: Array<{ id: string, name: string }>
        }> = []
        // Send back mutual servers.
        ctx.client.guilds.forEach(guild => {
          if (guild.members.has(ctx.tempDB.link[linkToken])) {
            servers.push({
              serverId: guild.id,
              name: guild.name,
              icon: guild.iconURL || 'no icon',
              channels: guild.channels.filter(i => i.type === 0).map(i => ({
                id: i.id, name: i.name
              })),
              perms: host === ctx.tempDB.link[linkToken]
                ? true : guild.members.get(ctx.tempDB.link[linkToken]).permissions.has('manageGuild')
            })
          }
        })
        return servers
      }
      return [{ serverId: 'Unavailable: invalid link token.', icon: 'no icon' }]
    },
    // Get user info.
    getOAuthUserInfo: async (_: string, { token }: { token: string }) => {
      // Get info about the user.
      type Base = { id: string }
      const headers = { Authorization: `Bearer ${token}` }
      const guilds: Array<Base> = await (await fetch(`${api}/users/@me/guilds`, { headers })).json()
      const { id }: Base = await (await fetch(`${api}/users/@me`, { headers })).json()
      // Generate the server info.
      let servers: Array<{
        perms: boolean, icon: string, serverId: string, name: string,
        channels: Array<{ id: string, name: string }>
      }> = []
      guilds.forEach(server => {
        if (ctx.client.guilds.has(server.id)) {
          const guild = ctx.client.guilds.get(server.id)
          servers.push({
            serverId: guild.id,
            name: guild.name,
            icon: guild.iconURL || 'no icon',
            channels: guild.channels.filter(i => i.type === 0).map(i => ({
              id: i.id, name: i.name
            })),
            perms: host === id || guild.members.get(id).permissions.has('manageGuild')
          })
        }
      })
      return servers
    },
    getBotId: () => ctx.client.user.id
  },
  Mutation: {
    editServerSettings: async (
      _: string, { input }: { input: {
        serverId: string, linkToken: string, addRoleForAll: string, joinAutorole: string,
        joinLeaveMessages: { channel: string, joinMessage: string, leaveMessage: string },
        ocrOnSend: boolean
      } }
    ) => {
      const {
        serverId, linkToken, addRoleForAll, joinAutorole, joinLeaveMessages, ocrOnSend
      } = input
      const member = ctx.client.guilds
        .find(t => t.id === serverId).members.get(ctx.tempDB.link[linkToken])
      if (member.permissions.has('manageGuild') || host === ctx.tempDB.link[linkToken]) {
        await getServerSettings(db, serverId)
        await db.collection('servers').updateOne({ serverID: serverId }, { $set: {
          addRoleForAll: addRoleForAll || undefined,
          joinAutorole: joinAutorole || undefined,
          ocrOnSend,
          joinLeaveMessages: joinLeaveMessages ? {
            channel: '',
            joinMessage: '',
            leaveMessage: '',
            banMessage: '',
            ...joinLeaveMessages
          } : undefined
        } })
        return getServerSettings(db, serverId)
      } else return { serverId: 'Forbidden.' }
    }
  }
})
