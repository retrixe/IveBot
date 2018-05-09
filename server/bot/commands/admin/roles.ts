import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission, checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event } from '../../imports/types'

// Give role.
export function handleGiverole (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Check for enough arguments.
  if (message.split(' ').length <= 1) return
  // Check for permissions.
  let allowed = false
  // Check user for permissions.
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_ROLES')) allowed = true
  else if (serverSettings.addRoleForAll) allowed = true
  if (!allowed) {
    sendResponse('Your server does not allow you to add roles.')
    return
  }
  // Check if add to another user.
  let possibleUser = getIdFromMention(getArguments(message).split(' ')[0])
  const possibleUser2 = getArguments(message).split(' ')[0]
  if (possibleUser2 in client.users) possibleUser = possibleUser2
  else if (
    Object.values(client.users).find(a => a.username.toLowerCase() === possibleUser2.toLowerCase())
  ) possibleUser = Object.values(client.users).find(a => a.username.toLowerCase() === possibleUser2.toLowerCase()).id
  // Role name.
  const role = getArguments(getArguments(message))
  let roleID
  try {
    roleID = Object.keys(client.servers[client.channels[event.d.channel_id].guild_id].roles)
      .includes(role) ? role : Object.values(
        client.servers[client.channels[event.d.channel_id].guild_id].roles
      ).find(a => a.name.toLowerCase() === role.toLowerCase()).id
  } catch (e) { sendResponse('You have provided an invalid role name/ID, pfft.'); return }
  // Respect role order.
  if (client.servers[client.channels[event.d.channel_id].guild_id].roles[roleID].position >
    checkRolePosition(client, event.d.author.id, client.channels[event.d.channel_id].guild_id)
  ) {
    sendResponse('You cannot give this role! People nowadays.')
    return
  } else if (Object.keys(
    client.servers[client.channels[event.d.channel_id].guild_id].members[event.d.author.id].roles
  ).includes(roleID)) {
    sendResponse('You pathetic person, that person already has the specified role.')
    return
  }
  if (possibleUser in client.users) {
    client.addToRole({
      serverID: client.channels[event.d.channel_id].guild_id,
      userID: possibleUser,
      roleID
    }, (err: string) => {
      if (err) sendResponse('Could not add role to user. Did you specify a role?')
      else sendResponse(`Gave role ${role} to <@${possibleUser}>.`)
    })
    return
  }
  client.addToRole({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID: event.d.author.id,
    roleID
  }, (err: string) => {
    if (err) sendResponse('Could not add role to user. Did you specify a role?')
    else sendResponse(`Gave you the role ${role}.`)
  })
}

// Take role.
export function handleTakerole (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Check for enough arguments.
  if (message.split(' ').length <= 1) return
  // Check for permissions.
  let allowed = false
  // Check user for permissions.
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_ROLES')) allowed = true
  else if (serverSettings.addRoleForAll) allowed = true
  if (!allowed) {
    sendResponse('Your server does not allow you to add roles.')
    return
  }
  // Respect role order.
  // Check if add to another user.
  let possibleUser = getIdFromMention(getArguments(message).split(' ')[0])
  const possibleUser2 = getArguments(message).split(' ')[0]
  if (possibleUser2 in client.users) possibleUser = possibleUser2
  else if (
    Object.values(client.users).find(a => a.username.toLowerCase() === possibleUser2.toLowerCase())
  ) possibleUser = Object.values(client.users).find(a => a.username.toLowerCase() === possibleUser2.toLowerCase()).id
  // Role name.
  const role = getArguments(getArguments(message))
  let roleID
  try {
    roleID = Object.keys(client.servers[client.channels[event.d.channel_id].guild_id].roles)
      .includes(role) ? role : Object.values(
        client.servers[client.channels[event.d.channel_id].guild_id].roles
      ).find(a => a.name.toLowerCase() === role.toLowerCase()).id
  } catch (e) { sendResponse('You have provided an invalid role name/ID, pfft.'); return }
  // Respect role order.
  if (client.servers[client.channels[event.d.channel_id].guild_id].roles[roleID].position >
    checkRolePosition(client, event.d.author.id, client.channels[event.d.channel_id].guild_id)
  ) {
    sendResponse('You cannot take away this role! People nowadays.')
    return
  } else if (Object.keys(
    client.servers[client.channels[event.d.channel_id].guild_id].members[event.d.author.id].roles
  ).includes(roleID)) {
    sendResponse('You pathetic person, that person does not have the specified role.')
    return
  }
  if (possibleUser in client.users) {
    client.removeFromRole({
      serverID: client.channels[event.d.channel_id].guild_id,
      userID: possibleUser,
      roleID: Object.values(
        client.servers[client.channels[event.d.channel_id].guild_id].roles
      ).find(a => a.name.toLowerCase() === role.toLowerCase()).id
    }, (err: string) => {
      if (err) sendResponse('Could not remove role from user. Did you specify a role?')
      else sendResponse(`Took role ${role} from <@${possibleUser}>.`)
    })
    return
  }
  client.removeFromRole({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID: event.d.author.id,
    roleID
  }, (err: string) => {
    if (err) sendResponse('Could not remove role from user. Did you specify a role?')
    else sendResponse(`Took away your role ${role}.`)
  })
}
