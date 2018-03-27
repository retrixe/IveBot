import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission } from '../../imports/permissions'
import { request } from 'graphql-request'
// Get types.
import { client, event } from '../../imports/types'

// Warn.
export function handleWarn (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (getArguments(message).split(' ').length < 2) {
    sendResponse('Correct usage: /warn <user> <reason>')
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

  // userID and server name.
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // Reason.
  const reason = getArguments(getArguments(message))
  // Set up the mutation.
  const serverID = client.channels[event.d.channel_id].guild_id
  const mutation = `
mutation {
  warn(warnedId: "${userID}", warnerId: "${event.d.author.id}", reason: "${reason}", serverId: "${serverID}") {
    date
  }
}
  `
  console.log(mutation)
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
      sendResponse(`**${user.username}#${user.discriminator}** has been warned. **lol.**`)
    }
  }, 1000)
}
