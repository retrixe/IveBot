// All the types!
import { IveBotCommand } from '../imports/types'
// All the tools!
import * as fetch from 'isomorphic-unfetch'
import * as moment from 'moment'
import { zeroWidthSpace } from '../imports/tools'
// Get the NASA API token.
import 'json5/lib/require'
import { NASAtoken, fixerAPIkey, weatherAPIkey } from '../../../config.json5'

export const handleCat: IveBotCommand = () => ({
  name: 'cat',
  opts: {
    description: 'Random cat from <https://random.cat>',
    fullDescription: 'Random cat from <https://random.cat>',
    usage: '/cat',
    argsRequired: false
  },
  generator: async () => {
    try {
      // Fetch a cat and process it (this sounds funny to me idk why)
      const { file } = await (await fetch(`http://aws.random.cat/meow`)).json()
      // Send it.
      return file
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  }
})

export const handleRobohash: IveBotCommand = () => ({
  name: 'robohash',
  opts: {
    description: 'Take some text, make it a robot/monster/head/cat.',
    fullDescription: 'Takes some text and hashes it in the form of an image :P',
    usage: '/robohash <cat/robot/monster/head> <text to hash>',
    aliases: ['robo', 'rh']
  },
  generator: (message, args) => {
    // Get text to hash.
    const target = args.shift()
    const text = args.join('%20')
    // Send a robohash.
    if (target === 'robot') return `https://robohash.org/${text}.png`
    else if (target === 'monster') return `https://robohash.org/${text}.png?set=set2`
    else if (target === 'head') return `https://robohash.org/${text}.png?set=set3`
    else if (target === 'cat') return `https://robohash.org/${text}.png?set=set4`
    else {
      return 'Proper usage: /robohash <robot, monster, head, cat> <text to robohash>'
    }
  }
})

export const handleApod: IveBotCommand = (client) => ({
  name: 'astronomy-picture-of-the-day',
  opts: {
    description: 'The astronomy picture of the day.',
    fullDescription: 'The astronomy picture of the day. Truly beautiful. Usually.',
    usage: '/astronomy-picture-of-the-day (date)',
    aliases: ['apod'],
    argsRequired: false
  },
  generator: async (message, args) => {
    // Check for date.
    const date = moment(args.join(' '), [
      moment.ISO_8601, moment.RFC_2822, 'Do M YYYY', 'Do MM YYYY', 'Do MMM YYYY',
      'Do MMMM YYYY', 'D M YYYY', 'D MM YYYY', 'D MMM YYYY', 'D MMMM YYYY'
    ])
    if (date.isValid()) {
      const dateStr = date.format('YYYY-MM-DD')
      // Fetch a picture.
      try {
        const { url, title, explanation } = await (await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}&date=${dateStr}`
        )).json()
        return {
          content: '**' + title + '**\n' + explanation,
          embed: { image: { url }, color: 0x2361BE }
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } else if (args.length) {
      return 'Invalid date.'
    }
    // Fetch a picture.
    try {
      const { hdurl, title, explanation } = await (await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`
      )).json()
      return {
        content: '**' + title + '**\n' + explanation,
        embed: { image: { url: hdurl }, color: 0x2361BE }
      }
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
  }
})

export const handleDog: IveBotCommand = (client) => ({
  name: 'dog',
  opts: {
    description: 'Random dog from <https://dog.ceo>',
    fullDescription: 'Random dog from <https://dog.ceo>',
    usage: '/dog (breed)',
    argsRequired: false
  },
  generator: async (message, args) => {
    if (args.length) {
      // Fetch a picture.
      try {
        const { message } = await (await fetch(
          `http://dog.ceo/api/breed/${args[0]}/images/random`
        )).json()
        return message
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    }
    // Fetch a picture.
    try {
      const { message } = await (await fetch(`http://dog.ceo/api/breeds/image/random`)).json()
      return message
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
  }
})

export const handleUrban: IveBotCommand = () => ({
  name: 'urban',
  opts: {
    description: 'Get an Urban Dictionary definition ;)',
    fullDescription: 'Get an Urban Dictionary definition ;)',
    usage: '/urban <term>',
    aliases: ['urb'],
    argsRequired: false // this is fun.
  },
  generator: async (message, args) => {
    try {
      // Fetch the definition and parse it to JSON.
      const { list } = await (await fetch(
        `http://api.urbandictionary.com/v0/define?term=${args.join(' ')}`
      )).json()
      try {
        let response = list[0].definition.trim()
        if (response.length > 1900) {
          const splitRes = response.split('')
          response = ''
          for (let i = 0; i < 595; i += 1) response += splitRes[i]
          response += '[...]'
        }
        return {
          content: `**🍸 Definition of ${args.join(' ')}:**`,
          embed: {
            color: 0x555555,
            description: response,
            footer: { text: 'Do not trust Urban Dictionary.' },
            title: args.join(' ')
          }
        }
        // Else, there will be an exception thrown.
      } catch (err) {
        return 'No definition was found.'
      }
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  }
})

export const handleNamemc: IveBotCommand = (client) => ({
  name: 'namemc',
  opts: {
    description: 'A Minecraft user\'s previous usernames and skin.',
    fullDescription: 'Displays previous usernames and skins of a Minecraft player.',
    usage: '/namemc <premium Minecraft username>',
    aliases: ['nmc']
  },
  generator: async (message, args) => {
    if (args.length > 1) return 'Minecraft users cannot have spaces in their name.'
    try {
      // Fetch the UUID and name of the user and parse it to JSON.
      const { id, name } = await (await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${args[0]}`
      )).json()
      // Fetch the previous names as well.
      try {
        const names: Array<{ name: string, changedToAt?: number }> = await (await fetch(
          `https://api.mojang.com/user/profiles/${id}/names`
        )).json()
        return {
          content: '**Minecraft history and skin for ' + name + ':**',
          embed: {
            color: 0x00AE86,
            title: 'Skin and Name History',
            fields: [...names.map(object => ({
              name: object.name,
              value: object.changedToAt
                ? `Changed to this name on ${moment(object.changedToAt).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
                : zeroWidthSpace
            })), { name: 'Skin', value: zeroWidthSpace }],
            description: '**Name History**\n',
            image: { url: `https://mc-heads.net/body/${id}`, height: 216, width: 90 },
            footer: { text: 'Skin is recovered through https://mc-heads.net' }
          }
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } catch (e) { return `Enter a valid Minecraft username (account must be premium)` }
  }
})

// Initialize cache.
let currency: { timestamp: number, rates: { [index: string]: number } }
export const handleCurrency: IveBotCommand = () => ({
  name: 'currency',
  opts: {
    description: 'Convert a currency from one currency to another.',
    fullDescription: 'Convert a currency from one currency to another.',
    usage: '/currency (list) <currency symbol to convert from> <currency symbol to convert to> (amount, default: 1)',
    aliases: ['cur']
  },
  generator: async (message, args) => {
    // Check cache if old, and refresh accordingly.
    if (!currency || Date.now() - currency.timestamp > 3600000) {
      currency = await ( // This just fetches the data and parses it to JSON.
        await fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
      ).json()
      currency.timestamp = Date.now() // To set the timestamp to the current time of the system.
    }
    // Calculate the currencies to conver from and to, as well as the amount.
    if (args.length < 2) return 'Invalid usage, use /help currency for proper usage.'
    const from = args[0].toUpperCase()
    const to = args[1].toUpperCase()
    // Check if everything is in order.
    if (from.length !== 3 || !currency.rates[from]) return 'Invalid currency to convert from.'
    else if (to.length !== 3 || !currency.rates[to]) return 'Invalid currency to convert to.'
    else if (!args[2]) args[2] = '1' // If no amount was provided, the amount should be one.
    else if (args.length > 3) return 'Enter a single number for currency conversion.'
    else if (isNaN(+args[2])) return 'Enter a proper number to convert.'
    // Now we convert the amount.
    const convertedAmount = ((currency.rates[to] / currency.rates[from]) * +args[2])
    const roundedOffAmount = Math.ceil(convertedAmount * Math.pow(10, 4)) / Math.pow(10, 4)
    return `**${from}** ${args[2]} = **${to}** ${roundedOffAmount}`
  }
})

// Our weather types.
/* eslint-disable no-undef,no-use-before-define,camelcase */
type Weather = { cod: string, coord: { lon: number, lat: number }, weather: Array<{
  main: string,
  description: string,
  icon: string
}>, main: { temp: number, temp_min: number, temp_max: number, humidity: number, pressure: number },
  visibility: number, wind: { speed: number, deg: number },
  clouds: { all: number }, rain: { '3h': number }, snow: { '3h': number }
} /* eslint-enable */
export const handleWeather: IveBotCommand = () => ({
  name: 'weather',
  opts: {
    description: 'It\'s really cloudy here..',
    fullDescription: 'What\'s the weather like at your place?',
    usage: '/weather <city name> (country code) (--fahrenheit or -f)',
    aliases: ['wt', 'test']
  },
  generator: async (message, args) => {
    const farhenheit = args.includes('--fahrenheit') || args.includes('-f')
    if (farhenheit) args.splice(args.includes('-f') ? args.indexOf('-f') : args.indexOf('--fahrenheit'), 1)
    // Get the response from our API.
    const weather: Weather = await (await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${args.join(',')}&appid=${weatherAPIkey}${
        farhenheit ? '&units=imperial' : '&units=metric'
      }`
    )).json()
    const temp = farhenheit ? '°F' : '°C'
    // If the place doesn't exist..
    if (weather.cod === '404') return 'Enter a valid city >_<'
    // We generate the entire embed.
    return {
      content: `**🌇🌃🌁🌆 The weather for ${args.join(', ')}:**`,
      embed: {
        title: 'Weather at ' + args.join(', '),
        color: 0x6D6BEA,
        description: `**Description:** ${weather.weather[0].main} - ${weather.weather[0].description}`,
        thumbnail: { url: `http://openweathermap.org/img/w/${weather.weather[0].icon}.png` },
        footer: { text: 'Weather data from https://openweathermap.org' },
        fields: [{
          name: 'Co-ordinates 🗺',
          value: `${Math.abs(weather.coord.lat)}${weather.coord.lat >= 0 ? '°N' : '°S'} /\
 ${Math.abs(weather.coord.lon)}${weather.coord.lon >= 0 ? '°E' : '°W'}
**(Latitude/Longitude)**`,
          inline: true
        }, {
          name: 'Temperature 🌡',
          value: `
${weather.main.temp}${temp}/${weather.main.temp_max}${temp}/${weather.main.temp_min}${temp}
**(avg/max/min)**`,
          inline: true // Description goes here
        }, {
          name: 'Wind 🎐',
          value: `${weather.wind.speed} m/s | ${weather.wind.deg}°
**(speed | direction)**`,
          inline: true
        }, { name: 'Pressure 🍃', value: weather.main.pressure + ' millibars', inline: true },
        { name: 'Humidity 💧', value: weather.main.humidity + '%', inline: true },
        {
          name: 'Cloud cover 🌥',
          value: weather.clouds ? `${weather.clouds.all}% of sky` : 'N/A',
          inline: true
        },
        {
          name: 'Visibility 🌫',
          value: weather.visibility ? `${weather.visibility} meters` : 'N/A',
          inline: true
        }, {
          name: 'Rain, past 3h 🌧',
          value: weather.rain ? `${weather.rain['3h']}mm` : 'N/A',
          inline: true
        }, {
          name: 'Snow, past 3h 🌨❄',
          value: weather.snow ? `${weather.snow['3h']}mm` : 'N/A',
          inline: true
        }]
      }
    }
  }
})
