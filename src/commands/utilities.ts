import { getArguments, getIdFromMention } from '../imports/tools'

type client = {
  /* eslint-disable no-undef */
  createDMChannel: Function,
  sendMessage: Function,
  deleteMessage: Function,
  channels: Object
  /* eslint-enable no-undef */
}

type event = { d: { id: string, channel_id: string } } // eslint-disable-line no-undef,camelcase

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
