import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event } from '../../imports/types'

// Ban!
export function handleBan (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!event.member.permission.has('banMembers')) {
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
    sendResponse('You cannot ban this person! People nowadays.'); return
  }
  // and.. cut.
  let banned = true
  client.kickGuildMember(event.member.guild.id, userID, getArguments(getArguments(message)))
    .then(() => sendResponse(`**${member.username}#${member.discriminator}** has been banned. **rip.**`))
    .catch(() => { sendResponse('I can\'t ban that person.'); banned = false })
  // DM the poor user.
  setTimeout(() => {
    if (!banned) return
    if (getArguments(getArguments(message)).trim()) {
      client.getDMChannel(userID).then((c) => client.createMessage(
        c.id, `You have been banned from ${serverName} for ${getArguments(getArguments(message))}.`
      ))
      // WeChill
      if (event.member.guild.id === '402423671551164416') {
        client.createMessage(
          '402437089557217290',
          `**${member.username}#${member.discriminator}** has been banned for **${getArguments(getArguments(message))}**.`
        )
      }
    } else {
      // WeChill
      if (event.member.guild.id === '402423671551164416') {
        client.createMessage(
          '402437089557217290',
          `**${member.username}#${member.discriminator}** has been banned for not staying chill >:L `
        )
      }
      client.getDMChannel(userID)
        .then((c) => client.createMessage(c.id, `You have been banned from ${serverName}.`))
    }
  }, 1000)
}

// Unban. Aw..
export function handleUnban (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!event.member.permission.has('banMembers')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (client.users.find(a => a.id === ifUserId)) userID = ifUserId
  else if (
    client.users.find(a => a.username.toLowerCase() === ifUserId.toLowerCase())
  ) userID = client.users.find(a => a.username.toLowerCase() === ifUserId.toLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const user = client.users.find(a => a.id === userID)
  if (!user) { sendResponse('Please specify a valid user.'); return }
  // Unban the person.
  client.unbanGuildMember(event.member.guild.id, userID, getArguments(getArguments(message)))
    .then(() => sendResponse(`**${user.username}#${user.discriminator}** has been unbanned.`))
    .catch(() => sendResponse('Could not unban that user.'))
}
