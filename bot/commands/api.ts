import * as fetch from 'isomorphic-unfetch'
import { getArguments } from '../imports/tools'
import * as moment from 'moment'
// Typings.
import { client } from '../imports/types'
// Get the NASA API token.
import 'json5/lib/require'
const { NASAtoken, weatherAPIkey, fixerAPIkey } = require('../../config.json5')

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
      ) => sendResponse('**' + json.title + '**\n' + json.explanation, () => '', {
        image: { url: json.url },
        color: 0x2361BE
      }))
    return
  } else if (getArguments(message)) {
    sendResponse('Invalid date. Sending today\'s APOD. ')
  }
  // Fetch a picture.
  fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { hdurl: string, title: string, explanation: string }
    ) => sendResponse('**' + json.title + '**\n' + json.explanation, () => '', {
      image: { url: json.hdurl },
      color: 0x2361BE
    }))
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

fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
  .then((res: { json: Function }) => res.json())
  .catch((err: string) => console.log(`Something went wrong 👾 Error: ${err}`))
  .then((json: { rates: { [index: string]: number }, timestamp: number }) => {
    exchangeRates = json
    exchangeRates.timestamp = Date.now()
  })
let exchangeRates: { timestamp: number, rates: { [index: string]: number } }
// Currency.
export function handleCurrency (message: string, sendResponse: Function) {
  if (!exchangeRates || Date.now() - exchangeRates.timestamp > 3600000) {
    fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { rates: { [index: string]: number }, timestamp: number }) => {
        exchangeRates = json
        exchangeRates.timestamp = Date.now()
      })
  }
  // Whee, currency conversion!
  let from = getArguments(message).split(' ')[0]
  let to = getArguments(message).split(' ')[1]
  let amount = getArguments(getArguments(getArguments(message))).trim()
  if (from.length !== 3 || !exchangeRates.rates[from]) {
    sendResponse('Invalid currency to convert from.')
    return
  } else if (!to || to.length !== 3 || !exchangeRates.rates[to]) {
    sendResponse('Invalid currency to convert to.')
    return
  } else if (!amount) {
    amount = '1'
  } else if (amount && amount.split(' ').length !== 1) {
    sendResponse('Enter a single number for currency conversion.')
    return
  } else if (amount && isNaN(+amount)) {
    sendResponse('Enter a proper number to convert.')
    return
  }
  from = from.toUpperCase()
  to = to.toUpperCase()
  let converted: string|Array<string> =
    ((exchangeRates.rates[to] / exchangeRates.rates[from]) * +amount).toString().split('.')
  converted[1] = converted[1].substr(0, 4)
  converted = converted.join('.')
  sendResponse(`**${from}** ${amount} = **${to}** ${converted}`)
}

// Namemc.
export function handleNamemc (message: string, sendResponse: Function, client: client, channel: string) {
  if (getArguments(message).split(' ').length > 1) {
    sendResponse('Minecraft users cannot have spaces in their name.')
    return
  }
  fetch(`https://api.mojang.com/users/profiles/minecraft/${getArguments(message).trim()}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => { if (err) sendResponse(`Enter a valid Minecraft username (account must be premium)`) })
    .then((json1: { id: string, name: string }) => {
      fetch(`https://api.mojang.com/user/profiles/${json1.id}/names`)
        .then((res: { json: Function }) => res.json())
        .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
        .then((json2: Array<{ name: string, changedToAt?: number }>) => {
          let history = '\n'
          json2.forEach(object => {
            if (object.changedToAt) {
              history += `**-** Name: ${object.name}
  Changed to this name on ${moment(object.changedToAt).format('dddd, MMMM Do YYYY, h:mm:ss A')}\n`
            } else history += `**-** Name: ${object.name}\n`
          })
          if (json2.length === 1) history = 'Name has not been changed.\n'
          client.sendMessage({
            to: channel,
            message: '**Minecraft history and skin for ' + getArguments(message).trim() + ':**',
            embed: {
              color: 0x00AE86,
              type: 'rich',
              title: 'Skin and Name History',
              description: `
**Name History**
${history}
[**Skin**](https://mc-heads.net/body/${json1.id})\n
              `,
              image: {
                url: `https://mc-heads.net/body/${json1.id}`,
                height: 216,
                width: 90
              },
              footer: { text: 'Skin is recovered through https://mc-heads.net' }
            }
          })
        })
    })
}
