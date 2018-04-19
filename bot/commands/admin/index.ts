import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission, checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event } from '../../imports/types'

// Import export from sub-files.
export { handleBan, handleUnban } from './ban'
export { handleWarn, handleWarnings } from './warn'
export { handleMute, handleUnmute } from './mute'
export { handleRemoverole, handleAddrole } from './roles'

// Kick!
export function handleKick (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_KICK_MEMBERS')) {
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
  if (checkRolePosition(client, user.id, client.channels[event.d.channel_id].guild_id) >=
    checkRolePosition(client, event.d.author.id, client.channels[event.d.channel_id].guild_id)
  ) {
    sendResponse('You cannot kick this person! People nowadays.')
    return
  }
  // and.. cut.
  let kicked = true
  client.kick({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
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
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been kicked for **${getArguments(getArguments(message))}**.`
        })
      }
    } else {
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been kicked for not staying chill >:L `
        })
      }
      client.sendMessage({ to: userID, message: `You have been kicked from ${serverName}.` })
    }
  }, 1000)
}
