import { getArguments, getIdFromMention } from '../imports/tools'
import { checkUserForPermission } from '../imports/permissions'
// Get types.
import { client, event, DB } from '../imports/types'
import 'json5/lib/require'
import { host } from '../../config.json5'

export function handleRequest (client: client, userID: string, sendResponse: Function, message: string) {
  client.createDMChannel(host)
  client.sendMessage({
    to: host,
    message: `<@${userID}>: ${getArguments(message)}`
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
    client.sendMessage({ to: possibleChannel, message: getArguments(getArguments(message)) }, (err: string, { id }: { id: string }) => {
      if (err) sendResponse('There was an error processing your request.')
      else db.say[possibleChannel] = id
    })
    return
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

export function handleEdit (message: string, sendResponse: Function, client: client, event: event) {
  // Check for enough permissions.
  let check = false
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) check = true
  else if (host === event.d.author.id) check = true
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
  if (!client.users[user].avatar) user = userID
  sendResponse(`https://cdn.discordapp.com/avatars/${user}/${client.users[user].avatar}.png?size=2048`)
}
