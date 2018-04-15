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
      members: {
        '13579': { roles: ['Administrator', 'Member'] },
        '24681': { roles: ['Moderator', 'Member'] },
        '24680': { roles: ['Member'] }
      }
    }
  }
}

test('checkUserForPermission works for people without permission', t => {
  t.not(cufp(client, '24680', '123456789', 'GENERAL_BAN_MEMBERS'), true)
})
test('checkUserForPermission works for people with permission', t => {
  t.is(cufp(client, '24681', '123456789', 'GENERAL_BAN_MEMBERS'), true)
})
test('checkUserForPermission works for administrators', t => {
  t.is(cufp(client, '13579', '123456789', 'GENERAL_BAN_MEMBERS'), true)
})
test('checkRolePosition works as expected', t => {
  t.is(crp(client, '13579', '123456789'), 3)
  t.is(crp(client, '24681', '123456789'), 2)
  t.is(crp(client, '24680', '123456789'), 1)
})
