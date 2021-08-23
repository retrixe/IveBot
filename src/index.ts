import 'json5/lib/require.js'
// Tokens and stuff.
import { Client, MessageWebhookContent } from 'eris'
import { SlashCommand, SlashCreator, GatewayServer, CommandContext, InteractionResponseFlags } from 'slash-create'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Import fs.
import { readdir, stat } from 'fs/promises'
import { inspect } from 'util'
import http from 'http'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
// Import types.
import { DB, Command, IveBotSlashGeneratorFunction } from './imports/types.js'
// Import the bot.
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
  // Full list: guildBans, guildIntegrations, guildWebhooks, guildInvites, guildVoiceStates,
  // guildMessageReactions, guildMessageTyping, directMessageReactions, directMessageTyping
  intents: [
    // guilds - IveBot code and dashboard require that all guilds are cached.
    // guildEmojis - Do away with and rely on Discord REST API?
    // guildMembers - IveBot code relies on the assumption that all members are cached. Reduce need?
    // guildPresences - Required for /userinfo to provide presence info.
    // guildMessages and directMessages - Naturally required.
    'guilds', 'guildEmojis', 'guildMembers', 'guildPresences', 'guildMessages', 'directMessages'
  ],
  allowedMentions: { everyone: false, roles: true, users: true },
  autoreconnect: true,
  restMode: true
})

// Create slash-create creator.
const creator = new SlashCreator({
  applicationID: Buffer.from(token.split('.')[0], 'base64').toString(), token
})
creator.withServer(new GatewayServer(
  (handler) => client.on('rawWS', (event) => {
    if (event.t === 'INTERACTION_CREATE') handler(event.d as any)
  }))
)

const commandToSlashCommand = (command: Command): SlashCommand => {
  class IveBotSlashCommand extends SlashCommand {
    constructor (creator: SlashCreator) {
      const reqs = command.opts.requirements
      const defaultPermission = !(reqs && (reqs.userIDs || reqs.custom))
      const requiredPermissions = []
      if (reqs && reqs.permissions) {
        // TODO: Does not support falsy permissions. Do we convert this to straightforward [] type?
        for (const permission in reqs.permissions) {
          if (reqs.permissions[permission]) {
            const translatedName = permission.toLowerCase().split('_').map((value, index) => (
              index === 0 ? value : value.substr(0, 1).toUpperCase() + value.substr(1)
            ))
            requiredPermissions.push(translatedName.join(''))
          }
        }
      }
      super(creator, {
        name: command.name,
        description: command.opts.description.replace(/</g, '').replace(/>/g, ''),
        defaultPermission,
        requiredPermissions,
        options: command.opts.slashOptions || []
      })
    }

    async run (ctx: CommandContext): Promise<string | MessageWebhookContent | void> {
      if (command.opts.guildOnly && !ctx.guildID) return 'This command can only be executed from a Discord guild!'
      if (typeof command.generator !== 'function') return command.generator
      const func: IveBotSlashGeneratorFunction = command.slashGenerator === true
        ? command.generator as any
        : command.slashGenerator
      const response = await Promise.resolve(func(ctx, { client, db, tempDB, commandParser }))
      const embedResponse = typeof response === 'object' && response.embed
        ? { ...response, embeds: [response.embed] }
        : response
      if (typeof embedResponse === 'object' && embedResponse.error) {
        embedResponse.flags = InteractionResponseFlags.EPHEMERAL
      }
      return embedResponse
    }
  }
  return new IveBotSlashCommand(creator)
}

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
const bubbleWrap = <F extends (...args: any[]) => any>(func: F) =>
  (...args: Parameters<F>) => { func(...args).catch(console.error) }
// When a server loses a member, it will callback.
client.on('guildMemberAdd', bubbleWrap(guildMemberAdd(client, db, tempDB)))
client.on('guildMemberRemove', bubbleWrap(guildMemberRemove(client, db)))
client.on('guildBanAdd', bubbleWrap(guildBanAdd(client, db)))
// When the bot leaves a server, it will callback.
client.on('guildDelete', bubbleWrap(guildDelete(db)))
// Register the commandParser.
const commandParser = new CommandParser(client, tempDB, db)
client.on('messageCreate', bubbleWrap(commandParser.onMessage))
client.on('messageUpdate', bubbleWrap(commandParser.onMessageUpdate))
// Register all commands in src/commands onto the CommandParser.
const toRead = dev ? './src/commands/' : './lib/commands/'
const commandFiles = await readdir(toRead)
// This only supports two levels of files, one including files inside commands, and one in..
// a subfolder.
commandFiles.push(dev ? 'admin/index.ts' : 'admin/index.js')
for (const commandFile of commandFiles) {
  // If it's a file..
  if ((await stat(toRead + commandFile)).isFile() && (commandFile.endsWith('.ts') || commandFile.endsWith('.js'))) {
    const commands: { [index: string]: Command } = await import('./commands/' + commandFile.replace('.ts', '.js'))
    // ..and there are commands..
    if (Object.keys(commands).length === 0) continue
    // ..register the commands.
    Object.keys(commands).forEach((commandName: string) => {
      // exclude TriviaSession from commands
      if (commandName === 'TriviaSession') return
      const command = commands[commandName]
      commandParser.registerCommand(command)
      // TODO: Custom and user ID requirements not handled yet.
      const reqs = command.opts.requirements
      const hasCustomReqs = (reqs && (reqs.custom || reqs.userIDs))
      if (!hasCustomReqs && (typeof command.generator !== 'function' || command.slashGenerator)) {
        creator.registerCommand(commandToSlashCommand(command))
      }
    })
  }
}
creator.syncCommands()

// Register setInterval to fulfill delayed tasks.
setInterval(() => {
  db.collection('tasks').find({ time: { $lte: Date.now() + 60000 } }).toArray().then(tasks => {
    if (tasks && tasks.length) {
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
  const headers = (body: NodeJS.ArrayBufferView | string): {} => ({
    'Content-Length': Buffer.byteLength(body), 'Content-Type': 'application/json'
  })
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
                textChannels: guild.channels.filter(c => c.type === 0).map(c => ({ id: c.id, name: c.name }))
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
              const textChannels = perm ? guild.channels.filter(c => c.type === 0) : []
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
  }).listen(isNaN(+process.env.IVEBOT_API_PORT) ? 7331 : +process.env.IVEBOT_API_PORT, () => {
    console.log('Listening for IveBot dashboard requests on', server.address())
  })
}
