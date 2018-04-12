import * as fetch from 'isomorphic-unfetch'
import { getArguments } from '../imports/tools'
import * as moment from 'moment'
// Typings.
import { client } from '../imports/types'
// Get the NASA API token.
import 'json5/lib/require'
const { NASAtoken, weatherAPIkey } = require('../../config.json5')

export function handleUrban (message: string, sendResponse: Function) {
  // Fetch the definition.
  fetch(`http://api.urbandictionary.com/v0/define?term=${getArguments(message)}`)
  // Convert to JSON.
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
  // If there is a definition, it will be sent successfully.
    .then((json: { list: Array<{ definition: string }> }) => {
      try {
        let response = json.list[0].definition.trim()
        if (response.length > 1900) {
          const splitRes = response.split('')
          response = ''
          for (let i = 0; i < 595; i += 1) response += splitRes[i]
          response += '[...]'
        }
        sendResponse(`
        **🍸 Definition of ${getArguments(message)}:**
        \`\`\`${response}\`\`\`
        `)
        // Else, there will be an exception thrown.
      } catch (err) {
        sendResponse('No definition was found.')
      }
    })
}

export function handleCat (message: string, sendResponse: Function) {
  // Fetch a cat.
  fetch(`http://aws.random.cat/meow`)
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
  } else {
    // Fetch a dog.
    fetch(`http://dog.ceo/api/breeds/image/random`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { message: string }) => sendResponse(json.message))
  }
}

export function handleRobohash (message: string, sendResponse: Function) {
  // Get text to hash.
  let text: string|Array<string> = getArguments(message).split(' ')
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
  // Check for date.
  const arrayOfDates = [
    moment.ISO_8601, moment.RFC_2822, 'Do M YYYY', 'Do MM YYYY', 'Do MMM YYYY',
    'Do MMMM YYYY', 'D M YYYY', 'D MM YYYY', 'D MMM YYYY', 'D MMMM YYYY'
  ]
  if (moment(getArguments(message), arrayOfDates).isValid()) {
    const date = moment(getArguments(message), arrayOfDates).format('YYYY-MM-DD')
    // Fetch a picture.
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}&date=${date}`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { url: string, title: string, explanation: string }
      ) => sendResponse(json.title + '\n' + json.url + '\n' + json.explanation))
    return
  } else if (getArguments(message)) {
    sendResponse('Invalid date. Sending today\'s APOD. ')
  }
  // Fetch a picture.
  fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { hdurl: string, title: string, explanation: string }
    ) => sendResponse(json.title + '\n' + json.hdurl + '\n' + json.explanation))
}

// Weather command.
// This is the response we expect.
/* eslint-disable no-undef,camelcase,no-use-before-define */
type weather = { cod: string, coord: { lon: string, lat: string }, weather: Array<{
  main: string,
  description: string
}>, main: { temp: number, temp_min: number, temp_max: number, humidity: number, pressure: number },
  visibility: number, wind: { speed: number, deg: number },
  clouds: { all: number }, rain: { '3h': number }, snow: { '3h': number }
}
/* eslint-enable no-undef,camelcase,no-use-before-define */
// This is the weather handling function.
export function handleWeather (message: string, sendResponse: Function, client: client, channel: string) {
  fetch(`http://api.openweathermap.org/data/2.5/weather?q=${getArguments(message)}&appid=${weatherAPIkey}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: weather) => {
      if (json.cod === '404') {
        sendResponse('Enter a valid city >_<')
      } else {
        client.sendMessage({
          embed: {
            color: 0x00AE86,
            type: 'rich',
            title: 'Weather',
            /* {"clouds":{"all":40},"sys":{"sunrise":1523078495,"sunset":1523126670}} */
            description: `
**Coordinates:** (longitude: ${json.coord.lon}) (latitude: ${json.coord.lat})
**Description:** ${json.weather[0].main} - ${json.weather[0].description}
**Temperature:** (avg: ${Math.floor(json.main.temp - 272.15)}) (max: ${Math.floor(json.main.temp_max - 272.15)}) (min: ${Math.floor(json.main.temp_min - 272.15)})
**Pressure:** ${json.main.pressure} millibars
**Humidity:** ${json.main.humidity}%
**Wind:** (speed: ${json.wind.speed} meter/sec) (direction: ${json.wind.deg} degree)\n` +
`${json.visibility ? `**Visibility:** ${json.visibility} meters` : ''}\n` +
`${json.clouds ? `**Cloud cover:** ${json.clouds.all}%` : ''}\n` +
`${json.rain ? `**Rain (past 3 hours):** ${json.rain['3h']}mm` : ''}\n` +
`${json.snow ? `**Snow (past 3 hours):** ${json.snow['3h']}mm` : ''}\n`,
            footer: { text: 'Weather data from https://openweathermap.org' }
          },
          message: `**🌇🌃🌁🌆 The weather for ${getArguments(message)}:**`,
          to: channel
        })
      }
    })
}
