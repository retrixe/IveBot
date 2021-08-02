import { Client } from 'eris'
import { MongoClient, Db, Document } from 'mongodb'
import { JwtPayload, verify, sign } from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-micro'
import config from '../config.json'
const { host, rootUrl, mongoUrl, jwtSecret, clientId, clientSecret, botToken } = config

// Create a MongoDB instance.
let db: Db
MongoClient.connect(mongoUrl === 'dotenv' ? process.env.MONGO_URL || '' : mongoUrl, (err, client) => {
  if (err || !client) throw err || new Error('MongoDB client is undefined!')
  console.log('GraphQL server connected successfully to MongoDB.')
  db = client.db('ivebot')
})

const botClient = new Client(`Bot ${botToken}`, { restMode: true })

// Helper functions.
const getServerSettings = async (serverID: string): Promise<Document> => {
  // Get serverSettings through query.
  let serverSettings = await db.collection('servers').findOne({ serverID })
  if (!serverSettings) {
    // Initialize server settings.
    await db.collection('servers').insertOne({ serverID })
    serverSettings = { serverID }
  }
  serverSettings.id = serverSettings.serverID
  delete serverSettings.serverID
  return serverSettings
}

interface ResolverContext {
  req: NextApiRequest
  res: NextApiResponse
}

const secure = rootUrl.startsWith('https') && process.env.NODE_ENV !== 'development' ? '; Secure' : ''
const authenticateRequest = async (req: NextApiRequest, res: NextApiResponse): Promise<string> => {
  const token = req.cookies['Discord-OAuth']
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
        res.setHeader('Set-Cookie', `Discord-OAuth="${token}"; Max-Age=2678400; HttpOnly; SameSite=Lax${secure}`)
        return accessToken
      } catch (e) { throw new AuthenticationError('The provided auth token has expired!') }
    }
    throw new AuthenticationError('Invalid JWT token in cookie!')
  }
}

// Set up resolvers.
export default {
  Query: {
    getServerSettings: async (parent: string, { id }: { id: string }, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const self = await client.getSelf()
      let hasPerm = false
      try {
        const fullGuild = await botClient.getRESTGuild(id)
        const selfMember = await botClient.getRESTGuildMember(id, self.id)
        hasPerm = fullGuild.permissionsOf(selfMember).has('manageGuild')
      } catch (e) {
        if (e.name === 'DiscordHTTPError') throw new ApolloError('Failed to make Discord request!')
        throw new ForbiddenError('You are not allowed to access this server\'s settings!')
      }
      if (hasPerm || host === self.id) {
        const serverSettings = await getServerSettings(id)
        // Insert default values for all properties.
        const defaultJoinMsgs = { channel: '', joinMessage: '', leaveMessage: '', banMessage: '' }
        return {
          id,
          joinAutorole: '',
          addRoleForAll: '',
          ocrOnSend: false,
          ...serverSettings,
          joinLeaveMessages: { ...defaultJoinMsgs, ...(serverSettings.joinLeaveMessages || {}) }
        }
      } else throw new ForbiddenError('You are not allowed to access this server\'s settings!')
    },
    getUserInfo: async (parent: string, args: {}, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const self = await client.getSelf()
      return {
        identifier: `${self.username}#${self.discriminator}`,
        avatar: self.avatarURL,
        id: self.id
      }
    },
    getUserServers: async (parent: string, args: {}, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const guilds = await client.getRESTGuilds()
      const self = await client.getSelf()
      return (await Promise.all(guilds
        .map(async guild => {
          /* TODO: Make a custom storage of all guilds IveBot is in to narrow down mutuals before
          asking Discord. Current solution is slow and hits rate limits for users in many servers. */
          let hasPerm = false
          try {
            const fullGuild = await botClient.getRESTGuild(guild.id)
            const selfMember = await botClient.getRESTGuildMember(guild.id, self.id)
            hasPerm = fullGuild.permissionsOf(selfMember).has('manageGuild')
          } catch (e) { return }
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL || 'no icon',
            channels: guild.channels.filter(i => i.type === 0)
              .map(i => ({ id: i.id, name: i.name })),
            perms: host === self.id || hasPerm
          }
        }))).filter(e => !!e)
    }
  },
  Mutation: {
    editServerSettings: async (
      parent: string,
      { id, newSettings }: {
        id: string
        newSettings: {
          addRoleForAll: string
          joinAutorole: string
          joinLeaveMessages: { channel: string, joinMessage: string, leaveMessage: string }
          ocrOnSend: boolean
        }
      },
      context: ResolverContext
    ) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const self = await client.getSelf()
      let hasPerm = false
      try {
        const fullGuild = await botClient.getRESTGuild(id)
        const selfMember = await botClient.getRESTGuildMember(id, self.id)
        hasPerm = fullGuild.permissionsOf(selfMember).has('manageGuild')
      } catch (e) {
        if (e.name === 'DiscordHTTPError') throw new ApolloError('Failed to make Discord request!')
        throw new ForbiddenError('You are not allowed to access this server\'s settings!')
      }
      if (hasPerm || host === self.id) {
        const serverSettings = await getServerSettings(id)
        // Insert default values for all properties.
        const defaultJoinMsgs = { channel: '', joinMessage: '', leaveMessage: '', banMessage: '' }
        await db.collection('servers').updateOne({ serverID: id }, {
          $set: {
            joinAutorole: '',
            addRoleForAll: '',
            ocrOnSend: false,
            ...serverSettings,
            joinLeaveMessages: { ...defaultJoinMsgs, ...(serverSettings.joinLeaveMessages || {}) }
          }
        })
        return await getServerSettings(id)
      } else throw new ForbiddenError('You are not allowed to access this server\'s settings!')
    }
  }
}
