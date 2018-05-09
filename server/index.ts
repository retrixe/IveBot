/* My efforts to roll the bot and dashboard into one.
The script has been as well documented as possible. */

/* SERVER CODE STARTS HERE */
// Import our express-based GraphQL server and next.
import * as next from 'next'
import * as graphql from 'graphql-yoga'
// Import our resolvers.
import resolvers from './resolvers'
// Import types.
import { DB } from './bot/imports/types'
/* SERVER CODE ENDS HERE */

// Tokens and stuff.
import * as Eris from 'eris'
// Import the bot.
import botCallback, { guildMemberEditCallback } from './bot'
// Get the token needed.
import 'json5/lib/require'
const { token } = require('../config.json5')

// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.

// Create a client to connect to Discord API Gateway.
const client = new Eris.Client(token === 'dotenv' ? process.env.IVEBOT_TOKEN : token, {
  autoreconnect: true
})

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  client.createMessage('361577668677861399', ``)
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
const tempDB: DB = {gunfight: [], say: {}, link: {}}

// When a message is sent, the function should be called.
client.on('messageCreate', botCallback(client, tempDB))

// When a server loses a member, it will callback.
client.on('guildMemberAdd', guildMemberEditCallback(client, 'guildMemberAdd'))
client.on('guildMemberRemove', guildMemberEditCallback(client, 'guildMemberRemove'))

/* SERVER CODE STARTS HERE */
// Initialize Next.js app.
const app = next({ dev })
const handle = app.getRequestHandler()
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
