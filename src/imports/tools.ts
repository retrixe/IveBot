import http, { type RequestOptions } from 'http'
import https from 'https'
import { URL } from 'url'
import type { Db, Document } from 'mongodb'
import type { GuildChannel, Member, Message, User } from '@projectdysnomia/dysnomia'

// Fresh insults. They come and go, I suppose.
export const getInsult = (plural = false): string => {
  const insults = [
    'pathetic lifeform',
    'ungrateful bastard',
    'idiotic slimeball',
    'worthless ass',
    'dumb dolt',
    'one pronged fork',
    'withered oak',
    'two pump chump',
    'oompa loompa',
  ]
  const insult = insults[Math.floor(Math.random() * insults.length)]
  return plural ? insult.replace('ass', 'asse') + 's' : insult
}

export const getIdFromMention = (mention: string): string => {
  const f = mention
    .substring(2, mention.length - 1)
    .replace('!', '')
    .replace('&', '')
    .split(':')
  return f[f.length - 1]
}

export const getServerSettings = async (db: Db, id: string): Promise<Document> => {
  // Get serverSettings through query.
  let serverSettings = await db.collection('servers').find({ id }).toArray()
  if (serverSettings.length === 0) {
    // Initialize server settings.
    await db.collection('servers').insertOne({ id })
    serverSettings = await db.collection('servers').find({ id }).toArray()
  }
  return serverSettings[0]
}

export const zeroWidthSpace = '​'

export const getUser = (message: Message, arg: string): User | undefined => {
  if (!arg || typeof arg !== 'string' || !message.member) return
  const mentions = message.mentions
  const guild = message.member.guild
  const member = guild.members.get(arg)
  if (member) return member.user
  else if (mentions.length > 0 && mentions[0].id === getIdFromMention(arg)) return mentions[0]
  // Filter members then use .find for order of precedence.
  const lower = arg.toLowerCase()
  const users = guild.members.filter(
    i =>
      i.nick?.toLowerCase() === lower ||
      i.username.toLowerCase() === lower ||
      i.username.toLowerCase() + '#' + i.discriminator === lower,
  )
  if (users.length === 0) return
  else if (users.length === 1) return users[0].user
  const userDiscrim = users.find(i => i.username.toLowerCase() + '#' + i.discriminator === lower)
  if (userDiscrim) return userDiscrim.user
  const username = users.find(i => i.username.toLowerCase() === lower)
  if (username) return username.user
  const nickname = users.find(i => i.nick && i.nick.toLowerCase() === lower)
  if (nickname) return nickname.user
}

export const getChannel = (message: Message, arg: string): GuildChannel | undefined => {
  if (!arg || typeof arg !== 'string' || !message.member) return
  const mentions = message.channelMentions
  const guild = message.member.guild
  if (guild.channels.has(arg)) return guild.channels.get(arg)
  else if (mentions.length > 0 && mentions[0] === getIdFromMention(arg)) {
    return guild.channels.get(mentions[0])
  } else if (guild.channels.find(i => i.name.toLowerCase() === arg.toLowerCase())) {
    return guild.channels.find(i => i.name.toLowerCase() === arg.toLowerCase())
  }
}

export const getMemberColor = (member: Member) =>
  member.roles
    .map(i => member.guild.roles.get(i))
    .sort((a, b) => (a.position > b.position ? -1 : 1))
    .find(i => i.color !== 0)?.color ?? 0

export const parseSilentDelete = (
  args: string[],
): { args: string[]; silent: boolean; delete: boolean } => {
  const data = { args, silent: false, delete: false }
  if ([0, 1].includes(data.args.indexOf('--silent')) || [0, 1].includes(data.args.indexOf('-s'))) {
    data.silent = true
    data.args.splice(data.args.indexOf('--silent'), 1)
  }
  if ([0, 1].includes(data.args.indexOf('--delete')) || [0, 1].includes(data.args.indexOf('-d'))) {
    data.delete = true
    data.args.splice(data.args.indexOf('--delete'), 1)
  }
  return data
}

export const fetchLimited = async (
  url: string,
  limit: number,
  opts: RequestOptions = {},
): Promise<false | Buffer> => {
  const byteLimit = limit * 1024 * 1024
  try {
    const contentLength =
      (await fetch(url, { method: 'HEAD' })).headers.get('content-length') || '-1'
    if (!isNaN(+contentLength) && +contentLength > byteLimit) return false
  } catch {} // Understandable that this may fail.
  // Create a Promise which resolves on stream finish.
  return await new Promise((resolve, reject) => {
    let size = 0
    const data: Buffer[] = []
    const parsedUrl = new URL(url)
    const get = parsedUrl.protocol === 'https:' ? https.get : http.get
    const req = get(parsedUrl, opts, res => {
      const contentLength = res.headers['content-length'] || '-1'
      if (!isNaN(+contentLength) && +contentLength > byteLimit) {
        req.destroy()
        resolve(false)
      }
      res.on('data', chunk => {
        if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk)
        data.push(chunk)
        size += (chunk as Buffer).length
        if (size > byteLimit) {
          req.destroy()
          resolve(false)
        }
      })
      res.on('end', () => {
        const concat = Buffer.concat(data)
        resolve(concat)
      })
      res.on('error', reject)
    })
    req.on('error', reject)
  })
}

export function isEquivalent(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  // Create arrays of property names
  const aProps = Object.getOwnPropertyNames(a)
  const bProps = Object.getOwnPropertyNames(b)

  // If number of properties is different, objects are not equivalent
  if (aProps.length !== bProps.length) return false

  for (const propName of aProps) {
    // If values of same property are not equal, objects are not equivalent
    if (a[propName] !== b[propName]) return false
  }

  // If we made it this far, objects are considered equivalent
  return true
}
