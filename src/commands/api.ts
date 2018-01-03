import fetch from 'node-fetch'

export function handleUrban (message: string, sendResponse: Function) {
  // Split the message.
  const splitMessage = message.split(' ')
  // Remove the command and get only the term.
  splitMessage.splice(0, 1)
  const term = splitMessage.join(' ')
  // Fetch the definition.
  fetch(`http://api.urbandictionary.com/v0/define?term=${term}`)
  // Convert to JSON.
    .then(res => res.json())
  // If there is a definition, it will be sent successfully.
    .then(json => {
      try {
        sendResponse(`\`\`\`${json.list[0].definition.trimLeft().trimRight()}\`\`\``)
        // Else, there will be an exception thrown.
      } catch (err) {
        sendResponse('No definition was found.')
      }
    })
}

export function handleCat (message: string, sendResponse: Function) {
  // Fetch a cat.
  fetch(`http://random.cat/meow`)
    .then(res => res.json())
    .catch(err => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then(json => sendResponse(json.file))
}

export function handleDog (message: string, sendResponse: Function) {
  // Fetch a cat.
  fetch(`http://random.dog/woof.json`)
    .then(res => res.json())
    .catch(err => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then(json => sendResponse(json.url))
}
