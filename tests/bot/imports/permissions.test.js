import test from 'ava'
import {
  checkUserForPermission as cufp, checkRolePosition as crp
} from '../../../lib/imports/permissions'

const client = {
  servers: {
    '123456789': {
      name: 'fake server',
      roles: {
        'Administrator': { position: 3, GENERAL_ADMINISTRATOR: true },
        'Moderator': { position: 2, GENERAL_BAN_MEMBERS: true },
        'Member': { position: 1 }
      },
      owner_id: '12345',
      members: {
        '13579': { roles: ['Administrator', 'Member'] },
        '24681': { roles: ['Moderator', 'Member'] },
        '24680': { roles: ['Member'] },
        '12345': { roles: ['Member'] }
      }
    }
  }
}

test('checkUserForPermission works for people without permission', t => {
  t.false(cufp(client, '24680', '123456789', 'GENERAL_BAN_MEMBERS'))
})
test('checkUserForPermission works for people with permission', t => {
  t.true(cufp(client, '24681', '123456789', 'GENERAL_BAN_MEMBERS'))
})
test('checkUserForPermission works for administrators', t => {
  t.true(cufp(client, '13579', '123456789', 'GENERAL_BAN_MEMBERS'))
})
test('checkUserForPermission respects ownership', t => {
  t.true(cufp(client, '12345', '123456789', 'GENERAL_BAN_MEMBERS'))
})
test('checkRolePosition works as expected', t => {
  t.is(crp(client, '13579', '123456789'), 3)
  t.is(crp(client, '24681', '123456789'), 2)
  t.is(crp(client, '24680', '123456789'), 1)
  t.is(crp(client, '12345', '123456789'), 9999)
})
