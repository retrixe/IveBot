/* My efforts to roll the bot and dashboard into one.
The script has been as well documented as possible. */

/* SERVER CODE STARTS HERE */
// Import our express-based GraphQL server and next.
import * as next from 'next'
import * as graphql from 'graphql-yoga'
// Import our resolvers.
import resolvers from './resolvers'
// Import environment variables from dotenv.
// require('dotenv').config()
/* SERVER CODE ENDS HERE */

// Tokens and stuff.
import { Client } from 'discord.io'
// Get MongoDB.
import { MongoClient } from 'mongodb'
// Get the token needed.
import 'json5/lib/require'
const { token, mongoURL } = require('../config.json5')

/* SERVER CODE STARTS HERE */
// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.

// Initialize Next.js app.
const app = next({ dev })
const handle = app.getRequestHandler()
/* SERVER CODE ENDS HERE */

// Online since?
let onlineSince = Math.abs(new Date().getTime())

// Require the bot, built or unbuilt.
let botCallback
try {
  botCallback = require('../lib/index').default
} catch (e) {
  botCallback = require('../bot/index').default
}

// Create a MongoDB instance.
let db
MongoClient.connect(mongoURL === 'dotenv' ? process.env.MONGO_URL : mongoURL, (err, client) => {
  if (err) throw new Error('Error:\n' + err)
  console.log('Connected successfully to MongoDB.')
  db = client.db('ivebot')
})

// Create a client to connect to Discord API Gateway.
const client = new Client({
  token: token === 'dotenv' ? process.env.IVEBOT_TOKEN : token,
  autorun: true
})

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  client.sendMessage({ to: '361577668677861399', message: ``, typing: true })
  client.setPresence({
    game: {
      type: 1,
      name: 'DXMD (5k) on iMac Pro.',
      url: 'https://twitch.tv/sorrybutyoudontdeservewatchingthisgameunlessyouhaveamacipadoriphone'
    },
    idle_since: null
  })
})

// Disconnection from Discord will trigger the following.
client.on('disconnect', (errMsg, code) => {
  console.log('Error:\n', errMsg, code)
  if (!dev) throw new Error('Error:\n' + ' ' + errMsg + ' ' + code)
  else client.connect()
})

// Create a database to handle certain stuff.
const tempDB = {gunfight: [], say: {}, link: {}}

// When client recieves a message, it will callback.
client.on('message', botCallback(client, tempDB, onlineSince, db))

// WeChill specific configuration.
client.on('guildMemberAdd', (member, event) => {
  if (member.guild_id === '402423671551164416') {
    client.sendMessage({
      to: '402437089557217290',
      message: `Yoyo <@${member.id}> welcome to WeChill, stay chill.`
    })
    client.addToRole({
      serverID: member.guild_id,
      userID: member.id,
      roleID: '402429353096642561'
    })
  }
})
client.on('guildMemberRemove', (member, event) => {
  if (member.guild_id === '402423671551164416') {
    client.sendMessage({
      to: '402437089557217290',
      message: `Well ${event.d.user.username}#${event.d.user.discriminator} left us.`
    })
  }
})

/* SERVER CODE STARTS HERE */
// Prepare Next.js and then start server.
app.prepare().then(() => {
  const server = new graphql.GraphQLServer({
    typeDefs: './server/schema.graphql',
    resolvers: resolvers({ tempDB, client, db })
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
