/* My efforts to roll the bot and dashboard into one.
The script has been as well documented as possible. */

/* SERVER CODE STARTS HERE */
// Import our express-based GraphQL server and next.
import * as next from 'next'
import * as graphql from 'graphql-yoga'
// Import our resolvers.
import resolvers from './resolvers'
// Import types.
import { DB } from '../bot/imports/types'
/* SERVER CODE ENDS HERE */

// Tokens and stuff.
import { existsSync } from 'fs'
import { Client } from 'discord.io'
// Get the token needed.
import 'json5/lib/require'

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

// Get token.
const { token } = require(
  dev && existsSync('../config.dev.json5') ? '../config.dev.json5' : '../config.json5'
)

// Online since?
let onlineSince = Math.abs(new Date().getTime())

// Require the bot, built or unbuilt.
let botCallback
let guildMemberEditCallback
try {
  botCallback = require('../lib/index').default
  guildMemberEditCallback = require('../lib/index').guildMemberEditCallback
} catch (e) {
  botCallback = require('../bot/index').default
  guildMemberEditCallback = require('../bot/index').guildMemberEditCallback
}

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
const tempDB: DB = {gunfight: [], say: {}, link: {}, leave: []}

// When client recieves a message, it will callback.
client.on('message', botCallback(client, tempDB, onlineSince))

// When a server loses a member, it will callback.
client.on('guildMemberAdd', guildMemberEditCallback(client))
client.on('guildMemberRemove', guildMemberEditCallback(client))

/* SERVER CODE STARTS HERE */
// Prepare Next.js and then start server.
app.prepare().then(() => {
  const server = new graphql.GraphQLServer({
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
