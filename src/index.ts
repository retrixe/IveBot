// Tokens and stuff.
import { Client, CommandInteraction } from '@projectdysnomia/dysnomia'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Import fs.
import { readdir, stat } from 'fs/promises'
import { inspect } from 'util'
import http from 'http'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
// Import types.
import type { DB, Command } from './imports/types.js'
// Import the bot.
import SlashParser from './slash.js'
import CommandParser from './client.js'
import { guildMemberAdd, guildMemberRemove, guildDelete, guildBanAdd } from './events.js'
// Get the token needed.
import { token, mongoURL, jwtSecret } from './config.js'

// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
const dev = process.env.NODE_ENV !== 'production'

// Create a client to connect to Discord API Gateway.
const client = new Client(`Bot ${token === 'dotenv' ? process.env.IVEBOT_TOKEN : token}`, {
  gateway: {
    // Full list: guildBans, guildIntegrations, guildWebhooks, guildInvites, guildVoiceStates,
    // guildMessageReactions, guildMessageTyping, directMessageReactions, directMessageTyping
    intents: [
      // guilds - IveBot code and dashboard require that all guilds are cached.
      // guildEmojisAndSticker - Do away with and rely on Discord REST API?
      // guildMembers - IveBot code relies on the assumption that all members are cached. Reduce need?
      // guildPresences - Required for /userinfo to provide presence info.
      // guildMessages and directMessages - Naturally required.
      'guilds', 'guildEmojisAndStickers', 'guildMembers', 'guildPresences', 'guildMessages', 'directMessages', 'messageContent'
    ],
    autoreconnect: true
  },
  allowedMentions: { everyone: false, roles: true, users: true },
  restMode: true
})

// Create a cache to handle certain stuff.
const tempDB: DB = {
  gunfight: {}, say: {}, trivia: {}, leave: new Set(), mute: {}, cooldowns: { request: new Set() }
}

// Create a MongoDB instance.
const mongoClient = new MongoClient(mongoURL === 'dotenv' ? process.env.MONGO_URL || '' : mongoURL)

// Connect and intiialise commands and events on the client.
await mongoClient.connect()
console.log('Bot connected successfully to MongoDB.')
const db = mongoClient.db('ivebot')
const bubbleWrap = <F extends (...args: any[]) => any>(func: F) => (...args: Parameters<F>) => {
  func(...args).catch((e: Error) => console.error('An error was bubbled!', e))
}
// When a server loses a member, it will callback.
client.on('guildMemberAdd', bubbleWrap(guildMemberAdd(client, db, tempDB)))
client.on('guildMemberRemove', bubbleWrap(guildMemberRemove(client, db)))
client.on('guildBanAdd', bubbleWrap(guildBanAdd(client, db)))
// When the bot leaves a server, it will callback.
client.on('guildDelete', bubbleWrap(guildDelete(db)))
// Register the commandParser.
const commandParser = new CommandParser(client, tempDB, db)
client.on('messageCreate', bubbleWrap(async m => await commandParser.onMessage(m)))
client.on('messageUpdate', bubbleWrap(async m => await commandParser.onMessageUpdate(m)))
const slashParser = new SlashParser(client, tempDB, db, commandParser)
client.on('interactionCreate', interaction => {
  if (interaction.type === 2 && interaction instanceof CommandInteraction) {
    if (!interaction.user) interaction.user = interaction.member?.user
    if (!Array.isArray(interaction.data.options)) interaction.data.options = []
    bubbleWrap(async () => await slashParser.handleCommandInteraction(interaction))()
  }
})
// Register all commands in src/commands onto the CommandParser.
const toRead = dev ? './src/commands/' : './lib/commands/'
const commandFiles = await readdir(toRead)
// This only supports two levels of files, one including files inside commands, and one in..
// a subfolder.
commandFiles.push(dev ? 'admin/index.ts' : 'admin/index.js')
for (const commandFile of commandFiles) {
  // If it's a file..
  if ((await stat(toRead + commandFile)).isFile() && (commandFile.endsWith('.ts') || commandFile.endsWith('.js'))) {
    const commands: Record<string, Command> = await import('./commands/' + commandFile.replace('.ts', '.js'))
    // ..and there are commands..
    if (Object.keys(commands).length === 0) continue
    // ..register the commands.
    Object.keys(commands).forEach((commandName: string) => {
      // exclude TriviaSession from commands
      if (commandName === 'TriviaSession') return
      const command = commands[commandName]
      commandParser.registerCommand(command)
      if (typeof command.generator !== 'function' || command.slashGenerator) {
        slashParser.registerCommand(command)
      }
    })
  }
}

// Register setInterval to fulfill delayed tasks.
setInterval(() => {
  db.collection('tasks').find({ time: { $lte: Date.now() + 60000 } }).toArray().then(tasks => {
    if (tasks?.length) {
      tasks.forEach(task => setTimeout(() => {
        // TODO: What if no perms?
        if (task.type === 'unmute') {
          client.removeGuildMemberRole(task.guild, task.user, task.target, 'Muted for fixed duration.')
            .catch(e => e.res.statusCode !== 404 && console.error(e))
        } else if (task.type === 'reminder') {
          client.createMessage(task.target, task.message)
            .catch(e => e.res.statusCode !== 404 && console.error(e))
        }
        db.collection('tasks').deleteOne({ _id: task._id })
          .catch(error => console.error('Failed to remove task from database.', error))
      }, task.time - Date.now()))
    }
  }).catch(console.error)
}, 60000)

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  // client.createMessage('361577668677861399', ``)
  client.editStatus('online', {
    name: 'DXMD (5k) on iMac Pro.',
    type: 1,
    url: 'https://twitch.tv/sorrybutyoudontdeservewatchingthisgameunlessyouhaveamacipadoriphone'
  })
  slashParser.registerAllCommands()
    .then(() => console.log('Successfully registered all Discord slash commands!'))
    .catch(err => console.error('An error occurred when registering Discord slash commands.', err))
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
    textChannels: Array<{ id: string, name: string }>
  }
  const key = createHash('sha256').update(jwtSecret).digest()
  const headers = (body: NodeJS.ArrayBufferView | string): {
    'Content-Length': number
    'Content-Type': string
  } => ({ 'Content-Length': Buffer.byteLength(body), 'Content-Type': 'application/json' })
  const port = process.env.IVEBOT_API_PORT && !isNaN(+process.env.IVEBOT_API_PORT)
    ? +process.env.IVEBOT_API_PORT
    : 7331
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/private') return
    let buffer = Buffer.from([])
    req.on('data', chunk => {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)])
      if (buffer.byteLength > 1024 * 8) req.destroy() // 8 kB limit
    })
    req.on('end', () => {
      (async () => {
        try {
          const decipher = createDecipheriv('aes-256-ctr', key, buffer.slice(0, 16))
          const data = Buffer.concat([decipher.update(buffer.slice(16)), decipher.final()])
          const valid: DiscordServerResponse[] = []
          const parsed: { id: string, host: boolean, guilds: string[] } = JSON.parse(data.toString('utf8'))
          if (typeof parsed.id !== 'string' || !Array.isArray(parsed.guilds)) throw new Error()
          await Promise.all(parsed.guilds.map(async id => {
            if (typeof id !== 'string' || id.length <= 16) return
            const guild = client.guilds.get(id)
            if (!guild) return
            if (parsed.host) {
              return valid.push({
                id,
                perm: true,
                textChannels: guild.channels
                  .filter(c => c.type === 0 || c.type === 5)
                  .map(c => ({ id: c.id, name: c.name }))
              })
            }
            let member = guild.members.get(parsed.id)
            if (!member) {
              try {
                member = await client.getRESTGuildMember(id, parsed.id)
                guild.members.add(member) // Cache the member for faster lookups.
              } catch (e) {} // TODO: Unable to retrieve member for the guild. Hm?
            }
            if (member) {
              const perm = guild.permissionsOf(member).has('manageGuild')
              const textChannels = perm ? guild.channels.filter(c => c.type === 0 || c.type === 5) : []
              valid.push({ id, perm, textChannels: textChannels.map(c => ({ id: c.id, name: c.name })) })
            }
          }))
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
        } catch (e) {
          const error = '{"error":"Invalid body!"}'
          return res.writeHead(400, headers(error)).end(error)
        }
      })().catch(console.error)
    })
  }).listen(port, () => console.log('Listening for IveBot dashboard requests on', server.address()))
}
