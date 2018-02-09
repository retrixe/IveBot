import { getArguments, getIdFromMention } from '../imports/tools'
import checkUserForPermission from '../imports/permissions'
import * as ms from 'ms'
import { request } from 'graphql-request'
// Get types.
import { client, event, roleType } from '../imports/types'

// Ban!
export function handleBan (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_BAN_MEMBERS')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Get information about user.
  const userID = getIdFromMention(getArguments(message).split(' ')[0])
  const user = client.users[userID]
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // and.. cut.
  let banned = true
  client.ban({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err.statusMessage === 'FORBIDDEN') {
      sendResponse('I can\'t ban that person.')
      banned = false
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been banned. **rip.**`)
  })
  // DM the poor user.
  setTimeout(() => {
    if (!banned) return
    if (getArguments(getArguments(message)).trim()) {
      client.sendMessage({
        to: userID,
        message: `You have been banned from ${serverName} for ${getArguments(getArguments(message))}.`
      })
    } else client.sendMessage({ to: userID, message: `You have been banned from ${serverName}.` })
  }, 1000)
}

// Kick!
export function handleKick (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_KICK_MEMBERS')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Get information about user.
  const userID = getIdFromMention(getArguments(message).split(' ')[0])
  const user = client.users[userID]
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // and.. cut.
  let kicked = true
  client.kick({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err.statusMessage === 'FORBIDDEN') {
      sendResponse('I can\'t kick that person.')
      kicked = false
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been kicked. **rip.**`)
  })
  // DM the poor user.
  setTimeout(() => {
    if (!kicked) return
    if (getArguments(getArguments(message)).trim()) {
      client.sendMessage({
        to: userID,
        message: `You have been kicked from ${serverName} for ${getArguments(getArguments(message))}.`
      })
    } else client.sendMessage({ to: userID, message: `You have been kicked from ${serverName}.` })
  }, 1000)
}

// Unban. Aw..
export function handleUnban (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_BAN_MEMBERS')) {
    sendResponse('You can\'t unban people.')
    return
  }
  // Get information about user.
  const userID = getIdFromMention(getArguments(message).split(' ')[0])
  const user = client.users[userID]
  // Unban the person.
  client.unban({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
      sendResponse('Cannot unban that person.')
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been unbanned.`)
  })
}

// Mute!
export function handleMute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('You can\'t mute people.')
    return
  }
  // userID.
  const userID = getIdFromMention(getArguments(message).split(' ')[0])
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
  if (getArguments(message).split(' ')[1]) {
    setTimeout(() => {
      client.removeFromRole({
        serverID: client.channels[event.d.channel_id].guild_id,
        roleID: role.id,
        userID
      })
    }, ms(getArguments(message).split(' ')[1]))
  }
}

// Unmute. Aw..
export function handleUnmute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('You can\'t unmute people.')
    return
  }
  // userID.
  const userID = getIdFromMention(getArguments(message).split(' ')[0])
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

// Warn.
export function handleWarn (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // userID and server name.
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  const userID = getIdFromMention(getArguments(message).split(' ')[0])
  // Reason.
  const reason = getArguments(getArguments(message))
  // Set up the mutation.
  const mutation = `
mutation {
  warn(warnedId: "${userID}", warnerId: "${event.d.author.id}", reason: "${reason}") {
    date
  }
}
  `
  // Tell the database via our API about this.
  let warned = true
  const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.
  request(`http://localhost:${port}/graphql`, mutation)
    .catch((err: string) => {
      if (err) { sendResponse(`Something went wrong 👾 Error: ${err}`); warned = false }
    })
  // DM the poor user.
  setTimeout(() => {
    if (warned) {
      client.sendMessage({
        to: userID,
        message: `You have been warned in ${serverName} for: ${reason}.`
      })
      const user = client.users[userID]
      sendResponse(`**${user.username}#${user.discriminator}** has been warned. **sorry.**`)
    }
  }, 1000)
}
