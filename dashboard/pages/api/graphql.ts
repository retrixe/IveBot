import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { readFileSync } from 'fs'
import gql from 'graphql-tag'
import { NextApiRequest, NextApiResponse } from 'next'
import resolvers from '../../imports/resolvers'

const typeDefs = gql(readFileSync('schema.graphql', { encoding: 'utf8' }))

const server = new ApolloServer({
  typeDefs,
  resolvers
})

export default startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, res: NextApiResponse) => await Promise.resolve({ req, res })
})
