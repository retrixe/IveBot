import fetch from 'node-fetch'
import { getArguments } from '../imports/tools'
// Get the NASA API token.
import 'json5/lib/require'
const { NASAtoken } = require('../../config.json5')

export function handleUrban (message: string, sendResponse: Function) {
  // Fetch the definition.
  fetch(`http://api.urbandictionary.com/v0/define?term=${getArguments(message)}`)
    // Convert to JSON.
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    // If there is a definition, it will be sent successfully.
    .then((json: { list: Array<{ definition: string }> }) => {
      try {
        sendResponse(`\`\`\`${json.list[0].definition.trimLeft().trimRight()}\`\`\``)
        // Else, there will be an exception thrown.
      } catch (err) {
        sendResponse('No definition was found.')
      }
    })
}

export function handleZalgo (message: string, sendResponse: Function) {
  // Fetch a zalgo.
  fetch(`http://zalgo.io/api?text=${getArguments(message)}`)
    .then((res: { text: Function }) => res.text())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((text: string) => sendResponse(text))
}

export function handleCat (message: string, sendResponse: Function) {
  // Fetch a cat.
  fetch(`http://random.cat/meow`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { file: string }) => sendResponse(json.file))
}

export function handleDog (message: string, sendResponse: Function) {
  if (getArguments(message).split(' ')[0].trim()) {
    fetch(`http://dog.ceo/api/breed/${getArguments(message).split(' ')[0]}/images/random`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { message: string }) => sendResponse(json.message))
  }
  // Fetch a dog.
  fetch(`http://dog.ceo/api/breeds/image/random`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { message: string }) => sendResponse(json.message))
}

export function handleRobohash (message: string, sendResponse: Function) {
  // Get text to hash.
  let text: string | Array<string> = getArguments(message).split(' ')
  text.splice(0, 1)
  text = text.join('%20')
  // Send a robohash.
  if (getArguments(message).split(' ')[0] === 'robot') sendResponse(`https://robohash.org/${text}.png`)
  else if (getArguments(message).split(' ')[0] === 'monster') sendResponse(`https://robohash.org/${text}.png?set=set2`)
  else if (getArguments(message).split(' ')[0] === 'head') sendResponse(`https://robohash.org/${text}.png?set=set3`)
  else if (getArguments(message).split(' ')[0] === 'cat') sendResponse(`https://robohash.org/${text}.png?set=set4`)
  else {
    sendResponse('Proper usage: /robohash <robot, monster, head, cat> <text to robohash>')
  }
}

export function handleApod (message: string, sendResponse: Function) {
  // Fetch a cat.
  fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { url: string, title: string, explanation: string }
    ) => sendResponse(json.title + '\n' + json.url + '\n' + json.explanation))
}
