import test from 'ava'
import {
  getArguments, getIdFromMention, getDesc, getInsult // , getServerSettings
} from '../../../server/bot/imports/tools'
// import { MongoDBServer } from 'mongomem'
// import { MongoClient } from 'mongodb'

// Test getUser.

// test.before('start server', async t => { await MongoDBServer.start() }) // Start Mongo in memory
// test.after.always('cleanup', t => MongoDBServer.tearDown()) // Cleans up temporary file storage

test(
  'getArguments returns proper arguments',
  t => t.is(getArguments('/test command args'), 'command args')
)
test(
  'getDesc returns proper arguments',
  t => t.is(getDesc({ content: '/test command args' }), 'command args')
)
test('getIdFromMention returns a correct ID for users', t => {
  t.is(getIdFromMention('<@!305053306835697674>'), '305053306835697674')
  t.is(getIdFromMention('<@305053306835697674>'), '305053306835697674')
})
test('getIdFromMention returns a correct ID for channels', t => {
  t.is(getIdFromMention('<#402423671551164418>'), '402423671551164418')
})
test('getIdFromMention returns a correct ID for roles', t => {
  t.is(getIdFromMention('<@&412741172709163009>'), '412741172709163009')
})
test('getIdFromMention returns a correct ID for emoji', t => {
  t.is(getIdFromMention('<:jry:402568226728312834>'), '402568226728312834')
})
test('getInsult works as expected', t => t.true([
  'pathetic lifeform', 'ungrateful bastard', 'idiotic slimeball', 'worthless ass', 'dumb dolt'
].includes(getInsult())))
/* test('getServerSettings works on servers with no settings', async t => {
  const db = await MongoClient.connect(await MongoDBServer.getConnectionString())
  t.truthy(await getServerSettings(db.db('ivebot'), '402423671551164416'))
}) */
