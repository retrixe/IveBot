import { getArguments, getIdFromMention } from '../imports/tools'
import { checkUserForPermission } from '../imports/permissions'
// Get types.
import { client, event, DB } from '../imports/types'
import 'json5/lib/require'
import { host } from '../../config.json5'
import * as ms from 'ms'

export function handleRequest (client: client, userID: string, sendResponse: Function, message: string) {
  if (!getArguments(message)) return
  const user = client.users[userID]
  client.createDMChannel(host)
  client.sendMessage({
    to: host,
    message: `${user.username}#${user.discriminator} with ID ${userID}: ${getArguments(message)}`
  })
  sendResponse(`<@${userID}>, what a pathetic idea. It has been DMed to the main developer and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`)
}

export function handleSay (message: string, sendResponse: Function, client: client, event: event, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage({ channelID: event.d.channel_id, messageID: event.d.id })
  // Should it be sent to another channel?
  const possibleChannel = getIdFromMention(getArguments(message).split(' ')[0])
  if (possibleChannel in client.channels) {
    if (getArguments(getArguments(message)).toLowerCase() === 'pls adim me') {
      sendResponse('no'); return
    }
    client.sendMessage({ to: possibleChannel, message: getArguments(getArguments(message)) }, (err: string, { id }: { id: string }) => {
      if (err) sendResponse('There was an error processing your request.')
      else db.say[possibleChannel] = id
    })
    return
  }
  if (getArguments(message).toLowerCase() === 'pls adim me') {
    sendResponse('no'); return
  }
  // Send the message all over again.
  sendResponse(getArguments(message), (err: string, { id }: { id: string }) => {
    if (err) sendResponse('There was an error processing your request.')
    else db.say[event.d.channel_id] = id
  })
}

export function handleEditLastSay (message: string, sendResponse: Function, client: client, event: event, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage({ channelID: event.d.channel_id, messageID: event.d.id })
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message).split(' ')[0])
  if (possibleChannel in client.channels) {
    client.editMessage({
      message: getArguments(getArguments(message)), channelID: possibleChannel, messageID: db.say[possibleChannel]
    }, (err: string) => { if (err) sendResponse('Nothing to edit.') })
    return
  }
  // Edit the message all over again.
  client.editMessage({
    message: getArguments(message), channelID: event.d.channel_id, messageID: db.say[event.d.channel_id]
  }, (err: string) => { if (err) sendResponse('Nothing to edit.') })
}

export function handleType (message: string, sendResponse: Function, client: client, event: event, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage({ channelID: event.d.channel_id, messageID: event.d.id })
  // Should it be sent to another channel?
  const possibleChannel = getIdFromMention(getArguments(message).split(' ')[0])
  if (possibleChannel in client.channels) {
    client.sendMessage({
      to: possibleChannel, message: getArguments(getArguments(message)), typing: true
    }, (err: string, { id }: { id: string }) => {
      if (err) sendResponse('There was an error processing your request.')
      else db.say[possibleChannel] = id
    })
    return
  }
  // Send the message all over again.
  client.sendMessage({
    to: event.d.channel_id, message: getArguments(message), typing: true
  }, (err: string, { id }: { id: string }) => {
    if (err) sendResponse('There was an error processing your request.')
    else db.say[event.d.channel_id] = id
  })
}

export function handleEdit (message: string, sendResponse: Function, client: client, event: event) {
  // Check for enough permissions.
  if (host !== event.d.author.id) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage({ channelID: event.d.channel_id, messageID: event.d.id })
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message).split(' ')[0])
  if (possibleChannel in client.channels) {
    client.editMessage({
      message: getArguments(getArguments(getArguments(message))),
      channelID: possibleChannel,
      messageID: getArguments(getArguments(message)).split(' ')[0]
    }, (err: string) => { if (err) sendResponse('Nothing to edit.') })
    return
  }
  // Send the message all over again.
  client.editMessage({
    message: getArguments(getArguments(message)),
    channelID: event.d.channel_id,
    messageID: getArguments(message).split(' ')[0]
  }, (err: string) => { if (err) sendResponse('Nothing to edit.') })
}

export function handleAvatar (message: string, sendResponse: Function, client: client, userID: string) {
  let user: string = getIdFromMention(getArguments(message).split(' ')[0])
  if (!user) user = userID
  if (!client.users[user].avatarURL) {
    sendResponse('Link: https://cdn.discordapp.com/embed/avatars/' + parseInt(client.users[user].discriminator, 10) % 5 + '.png?size=2048')
    return
  }
  sendResponse('Link: ' + client.users[user].avatarURL + '?size=2048')
}

export function handleRemindme (
  message: string, sendResponse: Function, client: client, userID: string
) {
  if (message.split(' ').length < 3 || !ms(message.split(' ')[1])) {
    sendResponse('Correct usage: /remindme <time in 1d|1h|1m|1s> <description>')
    return
  }
  const description = getArguments(getArguments(message))
  sendResponse(`You will be reminded in ${message.split(' ')[1]} - ${description} - through a DM.`)
  setTimeout(() => {
    client.sendMessage({
      to: userID,
      message: `⏰ ${description}\nReminder set ${message.split(' ')[1]} ago.`
    })
  }, ms(message.split(' ')[1]))
}

// List server regions!
const arrayOfServers = [
  'brazil', 'frankfurt', 'amsterdam', 'london', 'singapore', 'us-east',
  'us-central', 'us-south', 'us-west', 'sydney', 'japan', 'hongkong',
  'russia'
]
export function handleListserverregions (message: string, sendResponse: Function) {
  sendResponse('Available server regions: `brazil`, `frankfurt`, `amsterdam`, ' +
  '`london`, `singapore`, `us-east`, `us-central`, `us-south`, `us-west`, ' + '`sydney`, ' +
  '`japan`, `russia` and `hongkong`.')
}

export function handleChangeserverregion (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_GUILD')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (!checkUserForPermission(client, client.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_GUILD')) {
    sendResponse('I require the Manage Server permission to do that..')
  } else if (message.split(' ').length !== 2) {
    sendResponse('Correct usage: /changeserverregion <valid server region, /listserverregion>')
    return
  } else if (!arrayOfServers.includes(getArguments(message).toLowerCase())) {
    sendResponse('Invalid server voice region.')
    return
  }
  client.editServer({
    region: getArguments(message).toLowerCase(),
    serverID: client.channels[event.d.channel_id].guild_id
  })
  sendResponse('Voice region changed to `' + getArguments(message) + '` \\o/')
}
