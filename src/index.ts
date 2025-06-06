// Tokens and stuff.
import {
  Client,
  CommandInteraction,
  DiscordHTTPError,
  DiscordRESTError,
} from '@projectdysnomia/dysnomia'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Import fs.
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { inspect } from 'util'
import http from 'http'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
// Import types.
import type { DB, Command, Task } from './imports/types.ts'
// Import the bot.
import SlashParser from './slash.ts'
import CommandParser from './client.ts'
import { guildMemberAdd, guildMemberRemove, guildDelete, guildBanAdd } from './events.ts'
// Get the token needed.
import { token, mongoURL, jwtSecret } from './config.ts'

// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
// const dev = process.env.NODE_ENV !== 'production'

// Create a client to connect to Discord API Gateway.
const client = new Client(`Bot ${token === 'dotenv' ? process.env.IVEBOT_TOKEN : token}`, {
  gateway: {
    // Full list: guildBans, guildIntegrations, guildWebhooks, guildInvites, guildVoiceStates,
    // guildMessageReactions, guildMessageTyping, directMessageReactions, directMessageTyping
    intents: [
      'guilds', // IveBot code and dashboard require that all guilds are cached.
      'guildEmojisAndStickers', // Do away with and rely on Discord REST API?
      'guildMembers', // IveBot code relies on the assumption that all members are cached. Reduce need?
      'guildPresences', // Required for /userinfo to provide presence info.
      'guildMessages', // Naturally required.
      'directMessages', // Naturally required.
      'messageContent', // Required for command parsing.
    ],
    autoreconnect: true,
  },
  allowedMentions: { everyone: false, roles: true, users: true },
  restMode: true,
})

// Create a cache to handle certain stuff.
const tempDB: DB = {
  gunfight: new Map(),
  say: new Map(),
  trivia: new Map(),
  leave: new Set(),
  mute: new Set(),
  cooldowns: { request: new Set() },
}

// Create a MongoDB instance.
const mongoClient = new MongoClient(mongoURL === 'dotenv' ? process.env.MONGO_URL || '' : mongoURL)

// Connect and intiialise commands and events on the client.
await mongoClient.connect()
console.log('Bot connected successfully to MongoDB.')
const db = mongoClient.db('ivebot')
const bubbleWrap =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <F extends (...args: any[]) => Promise<any>>(func: F) =>
    (...args: Parameters<F>) => {
      func(...args).catch((e: unknown) => console.error('An error was bubbled!', e))
    }
// When a server loses a member, it will callback.
client.on('guildMemberAdd', bubbleWrap(guildMemberAdd(client, db, tempDB)))
client.on('guildMemberRemove', bubbleWrap(guildMemberRemove(client, db)))
client.on('guildBanAdd', bubbleWrap(guildBanAdd(client, db)))
// When the bot leaves a server, it will callback.
client.on('guildDelete', bubbleWrap(guildDelete(db)))
// Register the commandParser.
const commandParser = new CommandParser(client, tempDB, db)
client.on('messageCreate', bubbleWrap(commandParser.onMessage.bind(commandParser)))
client.on('messageUpdate', bubbleWrap(commandParser.onMessageUpdate.bind(commandParser)))
const slashParser = new SlashParser(client, tempDB, db, commandParser)
client.on('interactionCreate', interaction => {
  if (interaction.type === 2 && interaction instanceof CommandInteraction) {
    if (!interaction.user) interaction.user = interaction.member?.user
    if (!Array.isArray(interaction.data.options)) interaction.data.options = []
    bubbleWrap(async () => await slashParser.handleCommandInteraction(interaction))()
  }
})
// Register all commands in src/commands onto the CommandParser.
const toRead = join(import.meta.dirname, 'commands')
const commandFiles = await readdir(toRead)
// This only supports two levels of files, one including files inside commands, and one in..
// a subfolder.
// commandFiles.push(dev ? 'admin/index.ts' : 'admin/index.js')
for (const commandFile of commandFiles) {
  // If it's a file..
  if (
    (await stat(join(toRead, commandFile))).isFile() &&
    (commandFile.endsWith('.ts') || commandFile.endsWith('.js'))
  ) {
    const commands = (await import('./commands/' + commandFile)) as Record<string, Command>
    // ..and there are commands..
    if (Object.keys(commands).length === 0) continue
    // ..register the commands.
    Object.keys(commands).forEach((commandName: string) => {
      // exclude TriviaSession from commands
      if (commandName === 'TriviaSession') return
      const command = commands[commandName]
      commandParser.registerCommand(command)
      if (typeof command.generator !== 'function' || 'slashGenerator' in command) {
        slashParser.registerCommand(command)
      }
    })
  }
}

// Register setInterval to fulfill delayed tasks.
setInterval(
  bubbleWrap(async () => {
    const tasks = await db
      .collection('tasks')
      .find<Task>({ time: { $lte: Date.now() + 60000 } })
      .toArray()

    tasks?.forEach(task =>
      setTimeout(() => {
        // TODO: What if no perms?
        if (task.type === 'unmute') {
          client
            .removeGuildMemberRole(task.guild, task.user, task.target, 'Muted for fixed duration.')
            .catch((e: unknown) => {
              if (
                (e instanceof DiscordRESTError || e instanceof DiscordHTTPError) &&
                e.res.statusCode !== 404
              )
                console.error(e)
            })
        } else if (task.type === 'reminder') {
          client.createMessage(task.target, task.message).catch((e: unknown) => {
            if (
              (e instanceof DiscordRESTError || e instanceof DiscordHTTPError) &&
              e.res.statusCode !== 404
            )
              console.error(e)
          })
        }
        db.collection('tasks')
          .deleteOne({ _id: task._id })
          .catch((error: unknown) => console.error('Failed to remove task from database.', error))
      }, task.time - Date.now()),
    )
  }),
  60000,
)

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  // client.createMessage('361577668677861399', ``)
  client.editStatus('online', {
    name: 'DXMD (5k) on iMac Pro.',
    type: 1,
    url: 'https://twitch.tv/sorrybutyoudontdeservewatchingthisgameunlessyouhaveamacipadoriphone',
  })
  slashParser
    .registerAllCommands()
    .then(() => console.log('Successfully registered all Discord slash commands!'))
    .catch((err: unknown) => {
      console.error('An error occurred when registering Discord slash commands.', err)
    })
})

// Disconnection from Discord by error will trigger the following.
client.on('error', (err: Error, id: string) => {
  console.error(`Error: ${inspect(err, false, 0)}\nShard ID: ${id}`)
})

// Connect to Discord.
await client.connect()

// Start private HTTP API for the dashboard.
if (jwtSecret) {
  interface DiscordServerResponse {
    id: string
    perm: boolean
    textChannels: { id: string; name: string }[]
  }
  const key = createHash('sha256').update(jwtSecret).digest()
  const headers = (body: NodeJS.ArrayBufferView | string) => ({
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'application/json',
  })
  const port =
    process.env.IVEBOT_API_PORT && !isNaN(+process.env.IVEBOT_API_PORT)
      ? +process.env.IVEBOT_API_PORT
      : 7331
  const listener: http.RequestListener = (req, res) => {
    if (req.method !== 'POST' || req.url !== '/private') return
    let buffer = Buffer.from([])
    req.on('data', chunk => {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)])
      if (buffer.byteLength > 1024 * 8) req.destroy() // 8 kB limit
    })
    req.on('end', () => {
      ;(async () => {
        try {
          const decipher = createDecipheriv('aes-256-ctr', key, buffer.subarray(0, 16))
          const data = Buffer.concat([decipher.update(buffer.subarray(16)), decipher.final()])
          const valid: DiscordServerResponse[] = []
          const parsed = JSON.parse(data.toString('utf8')) as {
            id: string
            host: boolean
            guilds: string[]
          }
          if (typeof parsed.id !== 'string' || !Array.isArray(parsed.guilds)) throw new Error()
          const requests = parsed.guilds.map(async id => {
            if (typeof id !== 'string' || id.length <= 16) return
            const guild = client.guilds.get(id)
            if (!guild) return
            if (parsed.host) {
              return valid.push({
                id,
                perm: true,
                textChannels: guild.channels
                  .filter(c => c.type === 0 || c.type === 5)
                  .map(c => ({ id: c.id, name: c.name })),
              })
            }
            let member = guild.members.get(parsed.id)
            if (!member) {
              try {
                member = await client.getRESTGuildMember(id, parsed.id)
                guild.members.add(member) // Cache the member for faster lookups.
              } catch {
                // TODO: Unable to retrieve member for the guild. Hm?
              }
            }
            if (member) {
              const perm = guild.permissionsOf(member).has('manageGuild')
              const textChannels = perm
                ? guild.channels.filter(c => c.type === 0 || c.type === 5)
                : []
              valid.push({
                id,
                perm,
                textChannels: textChannels.map(c => ({ id: c.id, name: c.name })),
              })
            }
          })
          await Promise.all(requests)
          randomBytes(16, (err, iv) => {
            if (err) {
              const error = '{"error":"Internal Server Error!"}'
              return res.writeHead(500, headers(error)).end(error)
            }
            const cipher = createCipheriv('aes-256-ctr', key, iv)
            const data = Buffer.from(JSON.stringify(valid))
            const aesData = Buffer.concat([iv, cipher.update(data), cipher.final()])
            return res.writeHead(200, headers(aesData)).end(aesData)
          })
        } catch {
          const error = '{"error":"Invalid body!"}'
          return res.writeHead(400, headers(error)).end(error)
        }
      })().catch(console.error)
    })
  }
  const server = http
    .createServer(listener)
    .listen(port, () => console.log('Listening for IveBot dashboard requests on', server.address()))
}
