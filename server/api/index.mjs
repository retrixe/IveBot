// Our Apollo server currently lies here.
// Get our tools to make a schema and import types.
const { makeExecutableSchema } = require('graphql-tools')
const { readFileSync } = require('fs')
const { join } = require('path')

// Get our database.
const db = require('../database')

// Get our schema.
const typeDefs = readFileSync(join(process.cwd(), 'database', 'schema.graphql'), {
  encoding: 'utf8'
})

// Set up resolvers.
const resolvers = {
  Query: {
    allCards: () => CardsDB
  }
}

// Create and export a schema.
module.exports = makeExecutableSchema({
  typeDefs,
  resolvers
})
