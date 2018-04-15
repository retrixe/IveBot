import test from 'ava'
import {
  getArguments as ga, getIdFromMention as gifm
} from '../../../lib/imports/tools'

test('getArguments returns proper arguments', t => t.is(ga('/test command args'), 'command args'))
test('getIdFromMention returns a correct ID for users', t => {
  t.is(gifm('<@!305053306835697674>'), '305053306835697674')
  t.is(gifm('<@305053306835697674>'), '305053306835697674')
})
test('getIdFromMention returns a correct ID for channels', t => {
  t.is(gifm('<#402423671551164418>'), '402423671551164418')
})
test('getIdFromMention returns a correct ID for roles', t => {
  t.is(gifm('<@&412741172709163009>'), '412741172709163009')
})
test('getIdFromMention returns a correct ID for emoji', t => {
  t.is(gifm('<:jry:402568226728312834>'), '402568226728312834')
})
