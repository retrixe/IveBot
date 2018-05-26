import { getArguments, getIdFromMention } from '../../imports/tools'
// Get types.
import { client, event } from '../../imports/types'

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
