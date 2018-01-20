// Import the bot. Yes, it's a module.
import bot from './bot-connect' // eslint-disable-line no-unused-vars
// Import express and next.
import next from 'next'
import express from 'express'
// Import Apollo Server.
import bodyParser from 'body-parser'
import apollo from 'apollo-server-express'
import schema from './api'

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
  const server = express()
  // Add Apollo Server.
  server.use('/graphql', bodyParser.json(), apollo.graphqlExpress({ schema }))
  server.use('/graphiql', apollo.graphiqlExpress({ endpointURL: '/graphql' }))

  // On recieving GET on other endpoints, handle with Next.js.
  server.get('*', (req, res) => handle(req, res))

  // Listen to Express server on specified port.
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
