type client = {
  /* eslint-disable no-undef */
  createDMChannel: Function,
  sendMessage: Function
  /* eslint-enable no-undef */
}

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

export function handleChoose (message: string, sendResponse: Function) {
  // Is it used correctly?
  if (message.split('|').length === 1) {
    sendResponse('Correct usage: /choose item1|item2|...')
    return
  }
  const choices = message.substring(8, message.length).split('|')
  sendResponse(`I choose: ${choices[Math.floor(Math.random() * choices.length)]}`)
}
