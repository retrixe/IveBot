import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'
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
  if (!event.member.permission.has('manageMessages')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (
    isNaN(+getArguments(message)) || !getArguments(message) || +getArguments(message) === 0
  ) { sendResponse('Correct usage: /purge (channel) <number greater than 0>'); return }
  // Get the list of messages.
  client.getMessages(event.channel.id, +getArguments(message), event.id).then((res) => {
    res.push(event)
    client.deleteMessages(event.channel.id, res.map(e => e.id)).catch(() => {
      sendResponse(`Could not delete messages. Are the messages older than 2 weeks?`)
    })
  }).catch(() => sendResponse('Could not retrieve messages.'))
}

// Kick!
export function handleKick (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!event.member.permission.has('kickMembers')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (event.member.guild.members.find(a => a.id === ifUserId)) userID = ifUserId
  else if (
    event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase())
  ) userID = event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const member = event.member.guild.members.find(a => a.id === userID)
  if (!member) { sendResponse('Please specify a valid user.'); return }
  // Get information about user.
  const serverName = event.member.guild.name
  if (checkRolePosition(member) >= checkRolePosition(event.member)) {
    sendResponse('You cannot kick this person! People nowadays.'); return
  }
  // and.. cut.
  let kicked = true
  client.kickGuildMember(event.member.guild.id, userID, getArguments(getArguments(message)))
    .then(() => sendResponse(`**${member.username}#${member.discriminator}** has been kicked. **rip.**`))
    .catch(() => { sendResponse('I can\'t kick that person.'); kicked = false })
  // DM the poor user.
  setTimeout(() => {
    if (!kicked) return
    if (getArguments(getArguments(message)).trim()) {
      client.getDMChannel(userID).then((c) => client.createMessage(
        c.id, `You have been kicked from ${serverName} for ${getArguments(getArguments(message))}.`
      ))
      // WeChill
      if (event.member.guild.id === '402423671551164416') {
        client.createMessage(
          '402437089557217290',
          `**${member.username}#${member.discriminator}** has been kicked for **${getArguments(getArguments(message))}**.`
        )
      }
    } else {
      // WeChill
      if (event.member.guild.id === '402423671551164416') {
        client.createMessage(
          '402437089557217290',
          `**${member.username}#${member.discriminator}** has been kicked for not staying chill >:L `
        )
      }
      client.getDMChannel(userID)
        .then((c) => client.createMessage(c.id, `You have been kicked from ${serverName}.`))
    }
  }, 1000)
}
