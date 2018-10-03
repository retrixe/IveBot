/* My efforts to roll the bot and dashboard into one.
The script has been as well documented as possible. */

/* SERVER CODE STARTS HERE */
// Import our express-based GraphQL server and next.
import * as next from 'next'
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
// Import the bot.
import { guildMemberEditCallback } from './bot'
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
  autoreconnect: true
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
  client.on('guildMemberAdd', guildMemberEditCallback(client, 'guildMemberAdd', db))
  client.on('guildMemberRemove', guildMemberEditCallback(client, 'guildMemberRemove', db))
  // When a message is sent, the function should be called.
  // client.on('messageCreate', botCallback(client, tempDB, db))
  const commandParser = new CommandParser(client, tempDB, db)
  client.on('messageCreate', commandParser.onMessage)
  // Register all commands in bot/commands onto the CommandParser.
  readdir('./server/bot/commands', (err, commandFiles) => {
    // Handle any errors.
    if (err) { console.error(err); throw new Error('Commands could not be retrieved.') }
    // This only supports two levels of files, one including files inside commands, and one in..
    // a subfolder.
    commandFiles.forEach(commandFile => {
      // If it's a file..
      if (statSync('./server/bot/commands/' + commandFile).isFile() && commandFile.endsWith('.ts')) {
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
client.on('error', (err: string, id: string) => {
  if (!dev) throw new Error(`Error: ${err}\nShard ID: ${id}`)
})

// Create a database to handle certain stuff.
const tempDB: DB = { gunfight: [], say: {}, link: {}, leave: [] }

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

  // On recieving GET on other endpoints, handle with Next.js.
  server.express.get('*', (req, res) => handle(req, res))
})
/* SERVER CODE ENDS HERE */
