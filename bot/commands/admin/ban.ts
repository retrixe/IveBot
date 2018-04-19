import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission, checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event } from '../../imports/types'

// Ban!
export function handleBan (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_BAN_MEMBERS')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
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
  // Get information about user.
  const user = client.users[userID]
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // Respect role order.
  if (checkRolePosition(client, user.id, client.channels[event.d.channel_id].guild_id) >=
    checkRolePosition(client, event.d.author.id, client.channels[event.d.channel_id].guild_id)
  ) {
    sendResponse('You cannot ban this person! People nowadays.')
    return
  }
  // and.. cut.
  let banned = true
  client.ban({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
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
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been banned for **${getArguments(getArguments(message))}**.`
        })
      }
    } else {
      client.sendMessage({ to: userID, message: `You have been banned from ${serverName}.` })
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been banned for not staying chill >:L `
        })
      }
    }
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
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  const user = client.users[userID]
  // Unban the person.
  client.unban({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
      sendResponse('Cannot unban that person. Did you specify a user?')
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been unbanned.`)
  })
}
