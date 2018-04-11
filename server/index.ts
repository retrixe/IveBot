// Import our express-based GraphQL server, Prisma and next.
import * as next from 'next'
import * as graphql from 'graphql-yoga'
// Import our resolvers.
import resolvers from './resolvers'
// Import the bot. Yes, it's a module.
const { tempDB, client, db } = require('./bot-connect') // eslint-disable-line no-unused-vars
// Import environment variables from dotenv.
// require('dotenv').config()

// If production is explicitly specified via flag..
if (process.argv[2] === '--production') process.env.NODE_ENV = 'production'
// Check for development environment.
const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.

// Initialize Next.js app.
const app = next({ dev })
const handle = app.getRequestHandler()

// Prepare Next.js and then start server.
app.prepare().then(() => {
  const server = new graphql.GraphQLServer({
    typeDefs: './server/schema.graphql',
    resolvers,
    context: { tempDB, client, db }
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
