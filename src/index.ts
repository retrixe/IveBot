import 'json5/lib/require.js'
// Tokens and stuff.
import { Client } from 'eris'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Import fs.
import { readdir, stat } from 'fs/promises'
import { inspect } from 'util'
// Import types.
import { DB, Command } from './imports/types.js'
// Import the bot.
import CommandParser from './client.js'
import { guildMemberAdd, guildMemberRemove, guildDelete, guildBanAdd } from './events.js'
// Get the token needed.
import { token, mongoURL } from './config.js'

// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
const dev = process.env.NODE_ENV !== 'production'

// Create a client to connect to Discord API Gateway.
const client = new Client(`Bot ${token === 'dotenv' ? process.env.IVEBOT_TOKEN : token}`, {
  allowedMentions: { everyone: false, roles: true, users: true },
  autoreconnect: true,
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
    })
  }
}

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
