import { getArguments, getIdFromMention } from '../imports/tools'
// Get types.
import { client, message, DB } from '../imports/types'
import 'json5/lib/require'
import { host } from '../../../config.json5'

export function handleEditLastSay (message: message, sendResponse: Function, client: client, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (message.member.permission.has('manageMessages')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage(message.channel.id, message.id)
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message.content).split(' ')[0])
  if (message.channelMentions[0] === possibleChannel) {
    client.editMessage(possibleChannel, db.say[possibleChannel], getArguments(getArguments(
      message.content
    ))).catch(() => sendResponse('Nothing to edit.'))
    return
  }
  // Edit the message all over again.
  client.editMessage(message.channel.id, db.say[possibleChannel], getArguments(
    message.content
  )).catch(() => sendResponse('Nothing to edit.'))
}

export function handleEdit (message: message, sendResponse: Function, client: client) {
  // Check for enough permissions.
  if (host !== message.author.id) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage(message.channel.id, message.id)
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message.content).split(' ')[0])
  if (possibleChannel === message.channelMentions[0]) {
    client.editMessage(
      possibleChannel, getArguments(getArguments(message.content)).split(' ')[0],
      getArguments(getArguments(getArguments(message.content)))
    ).catch(() => sendResponse('Nothing to edit.'))
    return
  }
  // Send the message all over again.
  client.editMessage(
    message.channel.id, getArguments(message.content).split(' ')[0],
    getArguments(getArguments(message.content))
  ).catch(() => sendResponse('Nothing to edit.'))
}
