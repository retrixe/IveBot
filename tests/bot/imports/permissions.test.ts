import test from 'ava'
import { checkRolePosition } from '../../../server/bot/imports/permissions'
import { owner, regular, mutedHigh, mutedLow } from './permissions.prop'

test('Role position is returned correctly', t => {
  t.plan(4)
  t.is(checkRolePosition(owner, false, false), 2, 'Role position is returned correctly for owner')
  t.is(checkRolePosition(regular, false, false), 0, 'Role position is returned correctly for regular users')
  t.is(checkRolePosition(mutedHigh, false, false), 0, 'Role position is returned correctly for Muted with high role')
  t.is(checkRolePosition(mutedLow, false, false), 0, 'Role position is returned correctly for Muted with low role')
})

test('Role position is returned correctly when considering ownership', t => {
  t.plan(4)
  t.is(checkRolePosition(owner, true, false), 9999, 'Role position is returned correctly for owner')
  t.is(checkRolePosition(regular, true, false), 0, 'Role position is returned correctly for regular users')
  t.is(checkRolePosition(mutedHigh, true, false), 0, 'Role position is returned correctly for Muted with high role')
  t.is(checkRolePosition(mutedLow, true, false), 0, 'Role position is returned correctly for Muted with low role')
})

test('Role position is returned correctly when considering muted', t => {
  t.plan(4)
  t.is(checkRolePosition(owner, false), 2, 'Role position is returned correctly for owner')
  t.is(checkRolePosition(regular, false), 0, 'Role position is returned correctly for regular users')
  t.is(checkRolePosition(mutedHigh, false), 3, 'Role position is returned correctly for Muted with high role')
  t.is(checkRolePosition(mutedLow, false), 1, 'Role position is returned correctly for Muted with low role')
})

test('Role position is returned correctly when considering muted and owner', t => {
  t.plan(4)
  t.is(checkRolePosition(owner), 9999, 'Role position is returned correctly for owner')
  t.is(checkRolePosition(regular), 0, 'Role position is returned correctly for regular users')
  t.is(checkRolePosition(mutedHigh), 3, 'Role position is returned correctly for Muted with high role')
  t.is(checkRolePosition(mutedLow), 1, 'Role position is returned correctly for Muted with low role')
})
