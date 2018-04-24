import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission, checkRolePosition } from '../../imports/permissions'
import * as ms from 'ms'
// Get types.
import { client, event, roleType } from '../../imports/types'

// Mute!
export function handleMute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('You can\'t mute people.')
    return
  }
  // userID.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  const a = client.users[userID]
  if (!a) {
    sendResponse('Please specify a valid user.')
    return
  }
  // Respect role order.
  if (checkRolePosition(client, client.users[userID].id, client.channels[event.d.channel_id].guild_id) >=
    checkRolePosition(client, event.d.author.id, client.channels[event.d.channel_id].guild_id)
  ) {
    sendResponse('You cannot mute this person! People nowadays.')
    return
  }
  // Find a Muted role.
  const roles = client.servers[client.channels[event.d.channel_id].guild_id].roles
  // Sorry for the any.. but no other way :|
  let role = Object.values(roles).find((role) => role.name === 'Muted' || role.name === 'MutedNub')
  // Check for appropriate permissions.
  let r = false
  // Edit permissions of role if needed.
  if (role.TEXT_SEND_MESSAGES || role.VOICE_SPEAK) {
    client.editRole({
      serverID: client.channels[event.d.channel_id].guild_id,
      roleID: role.id,
      name: 'Muted',
      permissions: { TEXT_SEND_MESSAGES: false, VOICE_SPEAK: false }
    }, (err: { statusMessage: string }) => {
      if (err) { sendResponse('I could not add proper permissions to the Muted role.'); r = true }
    })
    if (r) return
    // Mute person.
    client.addToRole({ serverID: client.channels[event.d.channel_id].guild_id, roleID: role.id, userID }, (err: {}) => {
      if (err) sendResponse('Could not mute that person.')
      else { sendResponse('Muted.') }
    })
    // If no role, make a Muted role.
  } else if (!role) {
    client.createRole(client.channels[event.d.channel_id].guild_id, (
      err: { statusMessage: string }, res: roleType
    ) => {
      if (err) { sendResponse('I could not find a Muted role and cannot create a new one.'); r = true; return }
      role = res
      client.editRole({
        serverID: client.channels[event.d.channel_id].guild_id,
        roleID: res.id,
        name: 'Muted',
        permissions: { TEXT_SEND_MESSAGES: false, VOICE_SPEAK: false }
      })
    })
    if (r) return
    // Mute person.
    client.addToRole({ serverID: client.channels[event.d.channel_id].guild_id, roleID: role.id, userID }, (
      err: { statusMessage: string }
    ) => {
      if (err) sendResponse('Could not mute that person.')
      else { sendResponse('Muted.') }
    })
  } else {
    // Mute person.
    client.addToRole({ serverID: client.channels[event.d.channel_id].guild_id, roleID: role.id, userID }, (
      err: { statusMessage: string }
    ) => {
      if (err) sendResponse('Could not mute that person.')
      else { sendResponse('Muted.') }
    })
  }
  // If time given, set timeout.
  try {
    if (ms(getArguments(message).split(' ')[1])) {
      setTimeout(() => {
        client.removeFromRole({
          serverID: client.channels[event.d.channel_id].guild_id,
          roleID: role.id,
          userID
        })
      }, ms(getArguments(message).split(' ')[1]))
    }
  } catch (e) {}
}

// Unmute. Aw..
export function handleUnmute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('You can\'t unmute people.')
    return
  }
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const a = client.users[userID]
  if (!a) {
    sendResponse('Please specify a valid user.')
    return
  }

  // All roles of user and server.
  const roles = client.servers[client.channels[event.d.channel_id].guild_id].members[userID].roles
  const rolesOfServer = client.servers[client.channels[event.d.channel_id].guild_id].roles
  // Iterate over the roles.
  for (let roleIndex in roles) {
    const name = rolesOfServer[roles[roleIndex]].name
    if (name === 'Muted' || name === 'MutedNub') {
      client.removeFromRole({
        serverID: client.channels[event.d.channel_id].guild_id,
        userID,
        roleID: roles[roleIndex]
      })
      sendResponse('Unmuted.')
      break
    }
  }
}
