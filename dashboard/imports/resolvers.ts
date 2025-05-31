import { Client } from '@projectdysnomia/dysnomia'
import { promisify } from 'util'
import { GraphQLError } from 'graphql'
import { MongoClient, type Document } from 'mongodb'
import { type JwtPayload, verify, sign } from 'jsonwebtoken'
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto'
import config from '../config.json'
const { host, rootUrl, mongoUrl, jwtSecret, clientId, clientSecret, botToken, botApiUrl } = config

// Create a MongoDB instance.
const mongodb = new MongoClient(mongoUrl === 'dotenv' ? process.env.MONGO_URL || '' : mongoUrl)
mongodb.once('open', () => console.log('GraphQL server connected successfully to MongoDB.'))
const db = mongodb.db('ivebot')

const botClient = new Client(`Bot ${botToken}`, { restMode: true })

// Helper functions.
const defaultSettings = {
  joinAutorole: '',
  publicRoles: '',
  ocrOnSend: false,
  joinLeaveMessages: { channel: '', joinMessage: '', leaveMessage: '', banMessage: '' },
}
const getServerSettings = async (id: string): Promise<Document> => {
  await mongodb.connect()
  // Get serverSettings through query.
  const serverSettings = await db.collection('servers').findOne({ id })
  if (!serverSettings) {
    // Initialize server settings.
    await db.collection('servers').insertOne({ id })
  }
  return serverSettings || { id }
}

const encryptionKey = createHash('sha256').update(jwtSecret).digest()
const encrypt = async (data: Buffer): Promise<Buffer> => {
  const iv = await promisify(randomBytes)(16)
  const cipher = createCipheriv('aes-256-ctr', encryptionKey, iv)
  return Buffer.concat([iv, cipher.update(data), cipher.final()])
}
const decrypt = (data: Buffer): Buffer => {
  const cipher = createDecipheriv('aes-256-ctr', encryptionKey, data.slice(0, 16))
  return Buffer.concat([cipher.update(data.slice(16)), cipher.final()])
}
interface TextChannel {
  id: string
  name: string
}
const getMutualPermissionGuilds = async (
  id: string,
  guilds: string[],
  host = false,
): Promise<{ id: string; perm: boolean; textChannels: TextChannel[] }[]> => {
  if (botApiUrl) {
    let body: Buffer
    try {
      body = await encrypt(Buffer.from(JSON.stringify({ id, guilds, host })))
    } catch {
      throw new GraphQLError('Failed to encrypt IveBot request!', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }
    try {
      const request = await fetch(`${botApiUrl}/private`, { method: 'POST', body })
      if (!request.ok) {
        throw new GraphQLError('Failed to make request to IveBot private API!', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        })
      }
      return JSON.parse(decrypt(Buffer.from(await request.arrayBuffer())).toString('utf8'))
    } catch {
      throw new GraphQLError('Failed to make request to IveBot private API!', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      })
    }
  } else {
    const mutualGuildsWithPerm: { id: string; perm: boolean; textChannels: TextChannel[] }[] = []
    await Promise.all(
      guilds.map(async guild => {
        try {
          const fullGuild = await botClient.getRESTGuild(guild)
          const selfMember = await botClient.getRESTGuildMember(guild, id)
          const perm = host || fullGuild.permissionsOf(selfMember).has('manageGuild')
          mutualGuildsWithPerm.push({
            id: guild,
            perm,
            textChannels: perm
              ? fullGuild.channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }))
              : [],
          })
        } catch (e: any) {
          if (e.name === 'DiscordHTTPError') {
            throw new GraphQLError('Failed to make Discord request!', {
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            })
          }
        }
      }),
    )
    return mutualGuildsWithPerm
  }
}
const checkUserGuildPerm = async (id: string, guild: string, host = false): Promise<boolean> => {
  if (host) return true
  const mutuals = await getMutualPermissionGuilds(id, [guild])
  return mutuals.length === 1 && mutuals[0].perm
}

const secure =
  rootUrl.startsWith('https') && process.env.NODE_ENV !== 'development' ? '; Secure' : ''
const authenticateRequest = async (req: NextApiRequest, res: NextApiResponse): Promise<string> => {
  const token = req.cookies['Discord-OAuth']
  if (!token) {
    throw new GraphQLError('No auth cookie received!', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
  // Check if it's a JWT token issued by us.
  try {
    const decoded: string | JwtPayload | undefined = await new Promise((resolve, reject) => {
      verify(token, jwtSecret, {}, (err, decoded) => (err ? reject(err) : resolve(decoded)))
    })
    if (typeof decoded === 'string' || !decoded?.accessToken) {
      throw new GraphQLError('Invalid JWT token in cookie!', {
        extensions: { code: 'UNAUTHENTICATED' },
      })
    }
    return decoded.accessToken
  } catch (e: any) {
    // If expired, try refresh token to create a new one, else throw AuthenticationError.
    if (e.name === 'TokenExpiredError') {
      const decoded: string | JwtPayload | undefined = await new Promise((resolve, reject) => {
        verify(token, jwtSecret, { ignoreExpiration: true }, (err, decoded) =>
          err ? reject(err) : resolve(decoded),
        )
      })
      if (typeof decoded === 'string' || !decoded?.refreshToken || !decoded.scope) {
        throw new GraphQLError('Invalid JWT token in cookie!', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }
      try {
        const body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: decoded.refreshToken,
        }).toString()
        const {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
        } = await fetch('https://discord.com/api/v8/oauth2/token', {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST',
          body,
        }).then(async res => await res.json())

        const token = sign({ accessToken, refreshToken, scope: decoded.scope }, jwtSecret, {
          expiresIn,
        })
        res.setHeader(
          'Set-Cookie',
          `Discord-OAuth="${token}"; Max-Age=2678400; HttpOnly; SameSite=Lax${secure}`,
        )
        return accessToken
      } catch {
        throw new GraphQLError('The provided auth token has expired!', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }
    }
    throw new GraphQLError('Invalid JWT token in cookie!', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
}

// Set up resolvers.
interface ResolverContext {
  req: NextApiRequest
  res: NextApiResponse
}

export default {
  Query: {
    getServerSettings: async (parent: string, { id }: { id: string }, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const self = await client.getSelf()
      const hasPerm = await checkUserGuildPerm(self.id, id, host === self.id)
      if (hasPerm) {
        const serverSettings = await getServerSettings(id)
        // Insert default values for all properties.
        return {
          id,
          ...defaultSettings,
          ...serverSettings,
          joinLeaveMessages: {
            ...defaultSettings.joinLeaveMessages,
            ...(serverSettings.joinLeaveMessages || {}),
          },
        }
      } else {
        throw new GraphQLError("You are not allowed to access this server's settings!", {
          extensions: { code: 'FORBIDDEN' },
        })
      }
    },
    getUserInfo: async (parent: string, args: unknown, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const self = await client.getSelf()
      return {
        identifier: `${self.username}#${self.discriminator}`,
        avatar: self.avatarURL,
        id: self.id,
      }
    },
    getUserServers: async (parent: string, args: unknown, context: ResolverContext) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const guilds = await client.getRESTGuilds()
      const self = await client.getSelf()
      const mutuals = await getMutualPermissionGuilds(
        self.id,
        guilds.map(guild => guild.id),
        host === self.id,
      )
      return mutuals
        .map(mutual => {
          const guild = guilds.find(e => e.id === mutual.id)
          if (!guild) return null // Should never be hit.
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL || 'no icon',
            channels: mutual.textChannels,
            perms: mutual.perm,
          }
        })
        .filter(e => !!e)
    },
  },
  Mutation: {
    editServerSettings: async (
      parent: string,
      {
        id,
        newSettings,
      }: {
        id: string
        newSettings: {
          publicRoles?: string
          joinAutorole?: string
          joinLeaveMessages?: {
            channel?: string
            joinMessage?: string
            leaveMessage?: string
            banMessage?: string
          }
          ocrOnSend?: boolean
        }
      },
      context: ResolverContext,
    ) => {
      const accessToken = await authenticateRequest(context.req, context.res)
      const client = new Client(`Bearer ${accessToken}`, { restMode: true })
      const self = await client.getSelf()
      const hasPerm = await checkUserGuildPerm(self.id, id, host === self.id)
      if (hasPerm) {
        const serverSettings = await getServerSettings(id)
        await db.collection('servers').updateOne(
          { id },
          {
            $set: {
              ...defaultSettings,
              ...serverSettings,
              ...newSettings,
              joinLeaveMessages: {
                ...defaultSettings.joinLeaveMessages,
                ...(serverSettings.joinLeaveMessages || {}),
                ...(newSettings.joinLeaveMessages || {}),
              },
            },
          },
        )
        return await getServerSettings(id)
      } else {
        throw new GraphQLError("You are not allowed to access this server's settings!", {
          extensions: { code: 'FORBIDDEN' },
        })
      }
    },
  },
}
