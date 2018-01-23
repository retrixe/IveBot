// @flow
import { getArguments, getIdFromMention } from '../imports/tools'
import checkUserForPermission from '../imports/permissions'

// Flow our types.
type client = {
  channels: {},
  servers: {},
  users: {},
  sendMessage: Function,
  ban: Function,
  kick: Function,
  unban: Function
}
type event = {
  d: {
    channel_id: string,
    author: {
      id: string,
      username: string,
      discriminator: string
    }
  }
}

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
  }, (err) => {
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
  }, (err) => {
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
  }, (err) => {
    if (err) {
      sendResponse('Cannot unban that person.')
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been unbanned.`)
  })
}
