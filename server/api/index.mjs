// Our Apollo server currently lies here.
// Get our tools to make a schema and import types.
import graphql from 'graphql-tools'
import fs from 'fs'
import path from 'path'

// Get our database.
import db from '../database'

// Get our schema.
const typeDefs = fs.readFileSync(path.join(process.cwd(), 'server', 'database', 'schema.graphql'), {
  encoding: 'utf8'
})

// Set up resolvers.
const resolvers = {
  Query: {
    allCards: () => db
  }
}

// Create and export a schema.
export default graphql.makeExecutableSchema({
  typeDefs,
  resolvers
})
