import { ApolloServer, gql } from 'apollo-server-micro'
import { readFileSync } from 'fs'
import resolvers from '../../server/resolvers'

const typeDefs = gql(readFileSync('schema.graphql', { encoding: 'utf8' }))

const apolloServer = new ApolloServer({ typeDefs, resolvers: resolvers({}) })

const startServer = apolloServer.start()

export default async function handler (req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', 'https://studio.apollographql.com')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  if (req.method === 'OPTIONS') {
    res.end()
    return false
  }
  await startServer
  await apolloServer.createHandler({
    path: '/api/graphql'
  })(req, res)
}

export const config = { api: { bodyParser: false } }
