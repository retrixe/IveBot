/* My efforts to roll the bot and dashboard into one.
The script has been as well documented as possible. */

/* SERVER CODE STARTS HERE */
// Import our express-based GraphQL server and next.
import next from 'next'
import { GraphQLServer } from 'graphql-yoga'
// Import our resolvers.
import resolvers from './resolvers'
// Import types.
import { DB, Command } from './bot/imports/types'
/* SERVER CODE ENDS HERE */

// Tokens and stuff.
import { Client } from 'eris'
import CommandParser from './bot/client'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Import fs.
import { readdir, statSync } from 'fs'
import { inspect } from 'util'
// Import the bot.
import { guildMemberAdd, guildMemberRemove, guildDelete, guildBanAdd } from './bot'
// Get the token needed.
import 'json5/lib/require'
import { token, mongoURL } from '../config.json5'

// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.

// Create a client to connect to Discord API Gateway.
const client = new Client(token === 'dotenv' ? process.env.IVEBOT_TOKEN : token, {
  allowedMentions: { everyone: false, roles: true, users: true },
  autoreconnect: true,
  restMode: true
})

// Connect ASAP, hopefully before the server starts.
client.connect()

// Create a MongoDB instance.
MongoClient.connect(mongoURL === 'dotenv' ? process.env.MONGO_URL : mongoURL, {
  useNewUrlParser: true
}, (err, mongoDB) => {
  if (err) throw new Error('Error:\n' + err)
  console.log('Bot connected successfully to MongoDB.')
  const db = mongoDB.db('ivebot')
  // When a server loses a member, it will callback.
  client.on('guildMemberAdd', guildMemberAdd(client, db, tempDB))
  client.on('guildMemberRemove', guildMemberRemove(client, db))
  client.on('guildBanAdd', guildBanAdd(client, db))
  // When the bot leaves a server, it will callback.
  client.on('guildDelete', guildDelete(db))
  // Register the commandParser.
  const commandParser = new CommandParser(client, tempDB, db)
  client.on('messageCreate', commandParser.onMessage)
  client.on('messageUpdate', commandParser.onMessageUpdate)
  // Register all commands in bot/commands onto the CommandParser.
  const toRead = dev ? './server/bot/commands/' : './lib/bot/commands/'
  readdir(toRead, (err, commandFiles) => {
    // Handle any errors.
    if (err) { console.error(err); throw new Error('Commands could not be retrieved.') }
    // This only supports two levels of files, one including files inside commands, and one in..
    // a subfolder.
    commandFiles.push(dev ? 'admin/index.ts' : 'admin/index.js')
    commandFiles.forEach(commandFile => {
      // If it's a file..
      if (statSync(toRead + commandFile).isFile() && (commandFile.endsWith('.ts') || commandFile.endsWith('.js'))) {
        const commands: { [index: string]: Command } = require('./bot/commands/' + commandFile)
        // ..and there are commands..
        if (!Object.keys(commands).length) return
        // ..register the commands.
        Object.keys(commands).forEach((commandName: string) => {
          const command = commands[commandName]
          commandParser.registerCommand(command)
        })
      }
    })
  })
  // Register setInterval to fulfill delayed tasks.
  setInterval(async () => {
    const tasks = await db.collection('tasks').find({ time: { $lte: Date.now() + 60000 } }).toArray()
    if (tasks) {
      tasks.forEach(task => setTimeout(() => {
        if (task.type === 'unmute') {
          client.removeGuildMemberRole(task.guild, task.user, task.target, 'Muted for fixed duration.')
            .catch(e => e.res.statusCode !== 404 && console.error(e))
        } else if (task.type === 'reminder') {
          client.createMessage(task.target, task.message)
            .catch(e => e.res.statusCode !== 404 && console.error(e))
        }
        db.collection('tasks').deleteOne({ _id: task._id })
      }, task.time - Date.now()))
    }
  }, 60000)
})

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

// Create a database to handle certain stuff.
const tempDB: DB = {
  gunfight: {}, say: {}, link: {}, leave: [], mute: {}, cooldowns: { request: [] }
}

/* SERVER CODE STARTS HERE */
// Initialize Next.js app.
const app = next({ dev })
const handle = app.getRequestHandler()
// Prepare Next.js and then start server.
app.prepare().then(() => {
  const server = new GraphQLServer({
    typeDefs: './server/schema.graphql',
    resolvers: resolvers({ tempDB, client })
  })

  // Listen to requests on specified port.
  server.start({
    port,
    endpoint: '/graphql',
    playground: dev ? '/playground' : false,
    subscriptions: '/subscriptions'
  }, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })

  // On recieving GET on the / endpoint, render /index with Next.js instead of / for SEO.
  server.express.get('/', (req, res) => app.render(req, res, '/', req.query))
  // On recieving GET on other endpoints, handle with Next.js.
  server.express.get('*', (req, res) => handle(req, res))
})
/* SERVER CODE ENDS HERE */
