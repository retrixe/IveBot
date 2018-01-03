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
    message: `<@${userID}>: ${message}`
  })
  sendResponse(`<@${userID}>, what a pathetic idea. It has been DMed to the main developer and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`)
}

export function handleSay (message: string, sendResponse: Function, client: client, event: event) {
  // Delete the message.
  client.deleteMessage({ channelID: event.d.channel_id, messageID: event.d.id })
  // Remove the command and get only the words to say.
  const splitMessage = message.split(' ')
  splitMessage.splice(0, 1)
  // Should it be sent to another channel?
  const possibleChannel = splitMessage[0].substring(2, splitMessage[0].length - 1)
  if (possibleChannel in client.channels) {
    splitMessage.splice(0, 1)
    client.sendMessage({ to: possibleChannel, message: splitMessage.join(' ') })
    return
  }
  // Send the message all over again.
  sendResponse(splitMessage.join(' '))
}
