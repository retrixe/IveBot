import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission, checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event } from '../../imports/types'

// Import export from sub-files.
export { handleBan, handleUnban } from './ban'
export { handleWarn, handleWarnings, handleClearwarns, handleRemovewarn } from './warn'
export { handleMute, handleUnmute } from './mute'
export { handleGiverole, handleTakerole } from './roles'

// Purge!
export function handlePurge (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (
    isNaN(+getArguments(message)) || !getArguments(message) || +getArguments(message) === 0 ||
    +getArguments(message) > 100
  ) { sendResponse('Correct usage: /purge <number greater than 0 and less than 100>'); return }
  // Get the list of messages.
  client.getMessages({
    channelID: event.d.channel_id,
    limit: +getArguments(message),
    before: event.d.id
  }, (err: string, res: Array<{ id: string }>) => {
    if (err) { sendResponse(`Could not fetch messages, error ${err}`); return }
    res.push({ id: event.d.id })
    client.deleteMessages({
      channelID: event.d.channel_id, messageIDs: res.map(element => element.id)
    }, (err: string) => {
      if (err) sendResponse(`Could not delete messages. Are the messages older than 2 weeks?`)
    })
  })
}

// Slowmode!
export function handleSlowmode (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  const arg = getArguments(message)
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_CHANNELS')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (
    (isNaN(+arg) && arg !== 'off') || !arg || +arg < 0 || +arg > 120
  ) { sendResponse('Correct usage: /slowmode <number in seconds, max: 120 or off>'); return }
  // Set slowmode.
  client._req('patch', 'https://discordapp.com/api/channels/' + event.d.channel_id, {
    rate_limit_per_user: isNaN(+arg) ? 0 : +arg
  }, (err: boolean) => {
    if (err) sendResponse('I cannot use slowmode >_<')
    else sendResponse(`Successfully set slowmode to ${isNaN(+arg) || +arg === 0 ? 'off' : `${+arg} seconds`} 👌`)
  })
}

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
  if (!a) { sendResponse('Please specify a valid user.'); return }
  // Get information about user.
  const user = client.users[userID]
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  if (
    checkRolePosition(client, client.users[userID].id, client.channels[event.d.channel_id].guild_id) >=
    checkRolePosition(client, event.d.author.id, client.channels[event.d.channel_id].guild_id)
  ) { sendResponse('You cannot kick this person! People nowadays.'); return }
  // and.. cut.
  let kicked = true
  client.kick({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) { sendResponse('I can\'t kick that person.'); kicked = false; return }
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
