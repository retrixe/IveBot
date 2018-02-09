import { getArguments, getIdFromMention } from '../imports/tools'
// Get types.
import { client, event } from '../imports/types'

export function handleRequest (client: client, userID: string, sendResponse: Function, message: string) {
  client.createDMChannel('305053306835697674')
  client.sendMessage({
    to: '305053306835697674',
    message: `<@${userID}>: ${getArguments(message)}`
  })
  sendResponse(`<@${userID}>, what a pathetic idea. It has been DMed to the main developer and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`)
}

export function handleSay (message: string, sendResponse: Function, client: client, event: event) {
  if (event.d.author.id !== '305053306835697674') return
  // Delete the message.
  client.deleteMessage({ channelID: event.d.channel_id, messageID: event.d.id })
  // Should it be sent to another channel?
  const possibleChannel = getIdFromMention(getArguments(message).split(' ')[0])
  if (possibleChannel in client.channels) {
    client.sendMessage({ to: possibleChannel, message: getArguments(getArguments(message)) })
    return
  }
  // Send the message all over again.
  sendResponse(getArguments(message))
}
