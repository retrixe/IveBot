import { Client } from 'eris'
// import { MongoClient, Db } from 'mongodb'
import { JwtPayload, verify, sign } from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'
import { AuthenticationError } from 'apollo-server-micro'
import { host, jwtSecret, clientId, clientSecret } from '../../config.json'

// Create a MongoDB instance.
/* let db: Db
MongoClient.connect(mongoUrl === 'dotenv' ? process.env.MONGO_URL || '' : mongoUrl, (err, client) => {
  if (err || !client) throw err || new Error('MongoDB client is undefined!')
  console.log('GraphQL server connected successfully to MongoDB.')
  db = client.db('ivebot')
})

// Helper functions.
const getServerSettings = async (serverID: string) => {
  // Get serverSettings through query.
  let serverSettings = await db.collection('servers').findOne({ serverID })
  if (!serverSettings) {
    // Initialize server settings.
    await db.collection('servers').insertOne({ serverID })
    serverSettings = { serverID }
  }
  return serverSettings
} */

interface ResolverContext {
  req: NextApiRequest
  res: NextApiResponse
}

const authenticateRequest = async (req: NextApiRequest, res: NextApiResponse): Promise<string> => {
  const token = req.cookies['ivebot-oauth']
  if (!token) throw new AuthenticationError('No auth cookie received!')
  // Check if it's a JWT token issued by us.
  try {
    const decoded: JwtPayload | undefined = await new Promise((resolve, reject) => {
      verify(token, jwtSecret, {}, (err, decoded) => (err ? reject(err) : resolve(decoded)))
    })
    if (!decoded?.accessToken) throw new AuthenticationError('Invalid JWT token in cookie!')
    return decoded.accessToken
  } catch (e) {
    // If expired, try refresh token to create a new one, else throw AuthenticationError.
    if (e.name === 'TokenExpiredError') {
      const decoded: JwtPayload | undefined = await new Promise((resolve, reject) => {
        verify(token, jwtSecret, { ignoreExpiration: true }, (err, decoded) => (
          err ? reject(err) : resolve(decoded)
        ))
      })
      if (!decoded?.refreshToken || !decoded.scope) {
        throw new AuthenticationError('Invalid JWT token in cookie!')
      }
      try {
        const body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: decoded.refreshToken
        }).toString()
        const {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn
        } = await fetch('https://discord.com/api/v8/oauth2/token', {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, method: 'POST', body
        }).then(async (res) => await res.json())

        const token = sign({ accessToken, refreshToken, scope: decoded.scope }, jwtSecret, { expiresIn })
        res.setHeader('Set-Cookie', `Discord-OAuth="${token}"; HttpOnly; SameSite=Lax; Secure`)
        return accessToken
      } catch (e) { throw new AuthenticationError('The provided auth token has expired!') }
    }
    throw new AuthenticationError('Invalid JWT token in cookie!')
  }
}

// Set up resolvers.
export default {
  Query: {
    serverSettings: async (
      _: string, { serverId, linkToken }: { serverId: string, linkToken: string }
    ) => {
      /*
      const member = ctx.client.guilds
        .find(t => t.id === serverId).members.get(ctx.tempDB.link[linkToken])
      let {
        addRoleForAll, joinLeaveMessages, joinAutorole, ocrOnSend
      } = await getServerSettings(serverId)
      // Insert default values for all properties.
      joinLeaveMessages = joinLeaveMessages
        ? {
            channel: joinLeaveMessages.channel || '',
            joinMessage: joinLeaveMessages.joinMessage || '',
            leaveMessage: joinLeaveMessages.leaveMessage || '',
            banMessage: joinLeaveMessages.banMessage || ''
          }
        : { channel: '', joinMessage: '', leaveMessage: '', banMessage: '' }
      addRoleForAll = addRoleForAll || ''
      ocrOnSend = ocrOnSend || false
      joinAutorole = joinAutorole || ''
      // Check for permissions, and then send server settings.
      if (
        (member != null) && (member.permissions.has('manageGuild') || host === ctx.tempDB.link[linkToken])
      ) return { serverId, addRoleForAll, joinLeaveMessages, joinAutorole, ocrOnSend }
      else return { serverId: 'Forbidden.' }
      */
    },
    // Get user info.
    getUserInfo: (_: string, { linkToken }: { linkToken: string }) => {
      /*
      if (ctx.tempDB.link[linkToken]) {
        const servers: Array<{
          perms: boolean; icon: string; serverId: string; name: string;
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
                ? true
                : guild.members.get(ctx.tempDB.link[linkToken]).permissions.has('manageGuild')
            })
          }
        })
        return servers
      }
      return [{ serverId: 'Unavailable: invalid link token.', icon: 'no icon' }]
      */
    },
    getUserServers: async (parent: string, args: {}, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const guilds = await client.getRESTGuilds()
      const self = await client.getSelf()
      const servers: Array<{
        perms: boolean, icon: string, serverId: string, name: string,
        channels: Array<{ id: string, name: string }>
      }> = (await Promise.all(guilds // TODO: .filter(guild => ctx.client.guilds.has(guild.id))
        .map(async guild => {
          const selfMember = await client.getRESTGuildMember(guild.id, self.id)
          return {
            serverId: guild.id,
            name: guild.name,
            icon: guild.iconURL || 'no icon',
            channels: guild.channels.filter(i => i.type === 0).map(i => ({
              id: i.id, name: i.name
            })),
            perms: host === self.id || selfMember.permissions.has('manageGuild')
          }
        })))
      return servers
    }
  },
  Mutation: {
    editServerSettings: async (
      _: string, { input }: { input: {
        serverId: string, linkToken: string, addRoleForAll: string, joinAutorole: string,
        joinLeaveMessages: { channel: string, joinMessage: string, leaveMessage: string }
        ocrOnSend: boolean
      } }
    ) => {
      /*
      const {
        serverId, linkToken, addRoleForAll, joinAutorole, joinLeaveMessages, ocrOnSend
      } = input
      const member = ctx.client.guilds
        .find(t => t.id === serverId).members.get(ctx.tempDB.link[linkToken])
      if (member.permissions.has('manageGuild') || host === ctx.tempDB.link[linkToken]) {
        await getServerSettings(db, serverId)
        await db.collection('servers').updateOne({ serverID: serverId }, {
          $set: {
            addRoleForAll: addRoleForAll || undefined,
            joinAutorole: joinAutorole || undefined,
            ocrOnSend,
            joinLeaveMessages: joinLeaveMessages
              ? {
                  channel: '',
                  joinMessage: '',
                  leaveMessage: '',
                  banMessage: '',
                  ...joinLeaveMessages
                }
              : undefined
          }
        })
        return getServerSettings(db, serverId)
      } else return { serverId: 'Forbidden.' }
      */
    }
  }
}
