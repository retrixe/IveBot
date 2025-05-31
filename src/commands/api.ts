// All the types!
import type { Command } from '../imports/types.js'
// All the tools!
import fetch from 'node-fetch'
import moment from 'moment'
import Fuse from 'fuse.js'
import { Constants, type InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import { zeroWidthSpace, getInsult, fetchLimited, getIdFromMention } from '../imports/tools.js'
// Get the NASA API token.
import { NASAtoken, fixerAPIkey, weatherAPIkey, oxfordAPI, cvAPIkey } from '../config.js'
import fs from 'fs'

interface countriesInfo {
  'name': string
  'alpha-2': string
  'alpha-3': string
  'country-code': number
  'iso_3166-2': string
  'region': string
  'sub-region': string
  'intermediate-region': string
  'region-code': number
  'sub-region-code': number
  'intermediate-region-code': number
}
interface currenciesInfo {
  'AlphabeticCode': string
  'Currency': string
  'Entity': string
  'MinorUnit': number
  'NumericCode': number
  'WithdrawalDate': null
}

const countries = JSON.parse((await fs.promises.readFile('./src/data/countries.json', 'utf-8'))) as countriesInfo[]
const currencies = JSON.parse((await fs.promises.readFile('./src/data/currencies.json', 'utf-8'))) as currenciesInfo[]

function convertToSym (input: string): string {
  // For countries alpha codes.
  if (input.length === 3) {
    const info = countries.find(elem => elem['alpha-3'] === input)
    input = info ? info.name.toUpperCase().split(' ').join('') : input
  } else if (input.length === 2) {
    const info = countries.find(elem => elem['alpha-2'] === input)
    input = info ? info.name.toUpperCase().split(' ').join('') : input
  }
  // Find the matching Entity and return the currency code.
  const country = currencies.find(elem => elem.Entity.toUpperCase().split(' ').join('') === input)
  return country ? country.AlphabeticCode : input
}

export const handleOcr: Command = {
  name: 'ocr',
  aliases: ['textrecognition', 'itt', 'textr', 'text'],
  opts: {
    description: 'Get text from an image.',
    fullDescription: 'Get text from an image. Powered by Google Cloud Vision.',
    example: '/ocr <with uploaded image>',
    usage: '/ocr (--hastebin) <link to image/uploaded image/reply to an image>',
    argsRequired: false
  },
  generator: async (message, args, { client }) => {
    // To hasteb.in or not to hasteb.in.
    const useHastebin = args[0] === '--hastebin'
    if (useHastebin) args.shift()
    // Get the image and convert it to Base64.
    try {
      let url = (args.length > 0)
        ? args.join('%20')
        : message.attachments?.find(attachment => !!attachment)?.url
      if (message.messageReference) {
        const mess = message.referencedMessage || await client.getMessage(
          message.messageReference.channelID,
          message.messageReference.messageID
        )
        url = /^https?:\/\/\S+$/.test(mess.content)
          ? mess.content
          : mess.attachments?.find(attachment => !!attachment)?.url
      } else {
        // Check if a message link was passed.
        const regex = /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
        if (regex.test(url)) {
          const split = url.split('/')
          const mess = await client.getMessage(split[split.length - 2], split.pop())
          url = /^https?:\/\/\S+$/.test(mess.content)
            ? mess.content
            : mess.attachments?.find(attachment => !!attachment)?.url
        }
      }
      if (!url) return `Invalid image URL, you ${getInsult()}.`
      // const image = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
      const fetchedImage = await fetchLimited(url, 16)
      if (fetchedImage === false) return 'The file provided is larger than 16 MB!'
      const image = fetchedImage.toString('base64')
      // Now send the request.
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${cvAPIkey}`, {
        body: JSON.stringify({
          requests: [{
            image: { content: image }, features: [{ type: 'TEXT_DETECTION' }]
          }]
        }),
        method: 'POST'
      })
      // Parse the response.
      const result = await res.json() as { responses: Array<{ fullTextAnnotation: { text: string } }> }
      // If no text was found.
      if (!result.responses[0].fullTextAnnotation) return 'I was unable to get any results for the image.'
      // If the result is too long, upload it to paste.gg.
      const text = result.responses[0].fullTextAnnotation.text
      let hastebin = ''
      let deletionKey = ''
      try {
        if (text.length > 2000 || useHastebin) {
          const { result } = await fetch('https://api.paste.gg/v1/pastes', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: 'IveBot /ocr result', files: [{ content: { format: 'text', value: text } }]
            })
          }).then(async e => (await e.json()) as { result: { id: string, deletion_key: string } })
          hastebin = result.id
          deletionKey = result.deletion_key
        }
      } catch (e) {
        return `Failed to upload long OCR result to paste.gg! (${text.length} characters long)`
      }
      // Return our answer.
      return {
        content: hastebin
          ? `🤔 **Text recognition result uploaded to paste.gg${!useHastebin ? ' due to length' : ''}:**
https://paste.gg/p/anonymous/${hastebin} (use this key to delete: \`${deletionKey}\`)`
          : `🤔 **Text recognition result:**\n${text}`,
        embeds: [{
          color: 0x666666,
          author: {
            name: `${message.author.username}#${message.author.discriminator}'s Image`,
            icon_url: message.author.avatarURL
          },
          footer: {
            text: 'Powered by Google Cloud Vision API',
            icon_url: 'https://www.gstatic.com/devrel-devsite/prod/' +
            'v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/cloud/images/' +
            'favicons/onecloud/favicon.ico'
          },
          timestamp: new Date(message.timestamp).toISOString()
        }]
      }
    } catch (e) { console.error(e); return `Invalid image URL, you ${getInsult()}.` }
  }
}

export const handleHastebin: Command = {
  name: 'hastebin',
  aliases: ['hasteb.in', 'texturl', 'hbin', 'haste', 'paste.gg', 'pastegg', 'paste'],
  opts: {
    description: 'Upload a file to paste.gg to view on phone',
    fullDescription: 'Upload a file to paste.gg to view on phone',
    example: '/hastebin <with uploaded text file>',
    usage: '/hastebin <link to text file/uploaded text file>',
    argsRequired: false
  },
  generator: async (message, args, { client }) => {
    try {
      // Check if a message link was passed.
      const regex = /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
      let url = (args.length > 0) ? args.join('%20') : message.attachments?.find(attachment => !!attachment)?.url
      if (regex.test(url)) {
        const split = url.split('/')
        const mess = await client.getMessage(split[split.length - 2], split.pop())
        url = /^https?:\/\/\S+$/.test(mess.content) ? mess.content : mess.attachments?.find(attachment => !!attachment)?.url
      }
      // Fetch text file.
      // TODO: Outdated..
      const text = await fetchLimited(url, 0.4)
      if (text === false) return 'The file provided is larger than 400 KB (paste.gg limit)!'
      // Now send the request.
      const req = await fetch('https://api.paste.gg/v1/pastes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'IveBot paste.gg upload',
          files: [{
            name: message.attachments?.find(attachment => !!attachment)?.filename ?? 'pastefile1',
            content: { format: 'text', value: text.toString('utf8') }
          }]
        })
      })
      if (!req.ok) return 'Failed to upload text to paste.gg!'
      // Parse the response.
      const res = await req.json() as { result: { id: string, deletion_key: string } }
      const { id, deletion_key: deletionKey } = res.result
      return id
        ? `**paste.gg URL:**\nhttps://paste.gg/p/anonymous/${id}\nDeletion key: ${deletionKey}`
        : 'Failed to upload text to paste.gg!'
    } catch (e) { return `Invalid text file, you ${getInsult()}.` }
  }
}

export const handleCat: Command = {
  name: 'cat',
  opts: {
    description: 'Random cat from <https://random.cat>',
    fullDescription: 'Random cat from <https://random.cat>',
    usage: '/cat',
    example: '/cat',
    argsRequired: false
  },
  slashGenerator: true,
  generator: async () => {
    try {
      // Fetch a cat and process it (this sounds funny to me idk why)
      const { file } = await (await fetch('http://aws.random.cat/meow')).json() as { file: string }
      // Send it.
      return { embeds: [{ image: { url: file }, color: 0x123456 }], content: '🐱' }
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  }
}

export const handleRobohash: Command = {
  name: 'robohash',
  aliases: ['robo', 'rh'],
  opts: {
    description: 'Take some text, make it a robot/monster/head/cat/human.',
    fullDescription: 'Takes some text and hashes it in the form of an image :P',
    usage: '/robohash <cat/robot/monster/head/human> <text to hash>',
    example: '/robohash cat voldemort#6931'
  },
  generator: (message, args) => {
    // Get text to hash.
    const target = args.shift().toLowerCase()
    const text = args.join('%20')
    // Send a robohash.
    const color = 0xcf1c1c
    if (target === 'robot') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png` }, color }], content: '🤖'
      }
    } else if (target === 'monster') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set2` }, color }], content: '👾'
      }
    } else if (target === 'head') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set3` }, color }]
      }
    } else if (target === 'cat') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set4` }, color }]
      }
    } else if (target === 'human') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set5` }, color }], content: '🤔'
      }
    } else {
      return { content: 'Correct usage: /robohash <robot, monster, head, cat, human> <text to robohash>', error: true }
    }
  }
}

interface ApodResponse {
  url: string
  hdurl: string
  title: string
  media_type: string
  explanation: string
}

export const handleApod: Command = {
  name: 'astronomy-picture-of-the-day',
  aliases: ['apod'],
  opts: {
    description: 'The astronomy picture of the day.',
    fullDescription: 'The astronomy picture of the day. Truly beautiful. Usually.',
    usage: '/astronomy-picture-of-the-day (date)',
    example: '/astronomy-picture-of-the-day 2nd March 2017',
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
      // Fetch a picture or video.
      try {
        const { media_type: mediaType, url, title, explanation } = await (await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}&date=${dateStr}`
        )).json() as ApodResponse
        return mediaType === 'video'
          ? `**${title}**\n${explanation}\n${url.split('embed/').join('watch?v=')}`
          : {
              content: `**${title}**\n${explanation}`,
              embeds: [{ image: { url }, color: 0x2361BE }]
            }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } else if (args.length > 0) {
      return { content: 'Invalid date.', error: true }
    }
    // Fetch a picture or video.
    try {
      const { media_type: mediaType, url, hdurl, title, explanation } = await (await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`
      )).json() as ApodResponse
      return mediaType === 'video'
        ? `**${title}**\n${explanation}\n${url.split('embed/').join('watch?v=')}`
        : {
            content: `**${title}**\n${explanation}`,
            embeds: [{ image: { url: hdurl }, color: 0x2361BE }]
          }
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
  }
}

export const handleDog: Command = {
  name: 'dog',
  opts: {
    description: 'Random dog from <https://dog.ceo>',
    fullDescription: 'Random dog from <https://dog.ceo>',
    usage: '/dog (list) (breed, works with random image AND list) (sub-breed ONLY without list)',
    example: '/dog list | /dog labrador | /dog',
    argsRequired: false
  },
  generator: async (message, args) => {
    // List of breeds.
    if (args[0] === 'list') {
      try {
        const { message } = await (await fetch('https://dog.ceo/api/breeds/list/all')).json() as {
          message: Record<string, string[]>
        }
        // If only list of breeds was asked.
        if (!args[1]) return `**List of breeds:** ${Object.keys(message).join(', ')}`
        // If list of sub-breeds was asked.
        if (!message[args[1]]) return { content: 'This breed does not exist!', error: true }
        else if (message[args[1]].length === 0) return { content: 'This breed has no sub-breeds!', error: true }
        return `**List of sub-breeds:** ${message[args[1]].join(', ')}`
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
      // Fetch a random picture for a sub-breed.
    } else if (args[0] && args[1]) {
      try {
        let { message } = await (await fetch(
          `http://dog.ceo/api/breed/${args[0].toLowerCase()}/${args[1].toLowerCase()}/images/random`
        )).json() as { message: string }
        if (message.includes('Breed not found')) {
          ({ message } = await (await fetch(
            `http://dog.ceo/api/breed/${args.join('').toLowerCase()}/images/random`
          )).json() as { message: string })
        }
        if (!message || message.includes('Breed not found')) return { content: 'This breed/sub-breed does not exist!', error: true }
        return {
          embeds: [{ image: { url: message }, color: 0x654321 }],
          content: `🐕 ${args[0]} ${args[1]}`
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } else if (args[0]) {
      // Fetch a random picture for a breed.
      try {
        const { message } = await (await fetch(
          `http://dog.ceo/api/breed/${args[0].toLowerCase()}/images/random`
        )).json() as { message: string }
        if (!message || message.includes('Breed not found')) return 'This breed does not exist!'
        return { embeds: [{ image: { url: message }, color: 0x654321 }], content: '🐕 ' + args[0] }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    }
    // Fetch a random picture.
    try {
      const { message } = await (await fetch('http://dog.ceo/api/breeds/image/random')).json() as { message: string }
      return { embeds: [{ image: { url: message }, color: 0x654321 }], content: '🐕' }
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
  }
}

export const handleUrban: Command = {
  name: 'urban',
  aliases: ['urb'],
  opts: {
    description: 'Get an Urban Dictionary definition ;)',
    fullDescription: 'Get an Urban Dictionary definition ;)',
    usage: '/urban <term>',
    example: '/urban nub',
    argsRequired: false // this is fun.
  },
  generator: async (message, args) => {
    try {
      // Fetch the definition and parse it to JSON.
      const { list } = await (await fetch(
        `http://api.urbandictionary.com/v0/define?term=${args.join(' ')}`
      )).json() as { list: Array<{ definition: string }> }
      try {
        let response: string = list[0].definition.trim()
        if (response.length > 1900) {
          const splitRes: string[] = response.split('')
          response = ''
          for (let i = 0; i < 595; i += 1) response += splitRes[i]
          response += '[...]'
        }
        return {
          content: `**🍸 Definition of ${args.join(' ')}:**`,
          embeds: [{
            color: 0x555555,
            description: response,
            footer: { text: 'Do not trust Urban Dictionary.' },
            title: args.join(' ')
          }]
        }
        // Else, there will be an exception thrown.
      } catch (err) {
        return { content: 'No definition was found.', error: true }
      }
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  }
}

export const handleGoogle: Command = {
  name: 'google',
  aliases: ['g', 'lmgtfy'],
  opts: {
    description: 'Let me Google that for you.',
    fullDescription: 'Let me Google that for you.',
    usage: '/google <query>',
    example: '/google what is the meaning of life',
    options: [
      {
        name: 'query',
        description: 'The query to search for.',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true
      }
    ]
  },
  generator: (message, args) => `https://lmgtfy.com/?q=${encodeURIComponent(
    args.join(' ')).replace(/%20/g, '+')}`,
  slashGenerator: (interaction) => `https://lmgtfy.com/?q=${encodeURIComponent(
    (interaction.data.options[0] as InteractionDataOptionsString).value).replace(/%20/g, '+')}`
}

export const handleNamemc: Command = {
  name: 'namemc',
  aliases: ['nmc'],
  opts: {
    description: 'A Minecraft user\'s previous usernames and skin.',
    fullDescription: 'Displays previous usernames and skins of a Minecraft player.',
    usage: '/namemc <premium Minecraft username>',
    example: '/namemc voldemort'
  },
  generator: async (message, args) => {
    if (args.length > 1) return 'Minecraft users cannot have spaces in their name.'
    try {
      // Fetch the UUID and name of the user and parse it to JSON.
      const member = message.member?.guild.members.get(getIdFromMention(args[0]))
      const username = member ? (member.nick || member.username) : args[0]
      const { id, name } = await (await fetch(
        `https://api.mojang.com/users/profiles/minecraft/${username}`
      )).json() as { id?: string, name?: string }
      if (!id || !name) {
        return { content: 'Enter a valid Minecraft username (account must be premium)', error: true }
      }
      // Fetch the previous names as well.
      try {
        const names: Array<{ name: string, changedToAt?: number }> = [{
          name: 'Currently, username history is not available. ' +
            'See: https://help.minecraft.net/hc/en-us/articles/8969841895693-Username-History-API-Removal-FAQ-'
        }]
        /* await (await fetch(
          `https://api.mojang.com/user/profiles/${id}/names`
        )).json() as Array<{ name: string, changedToAt?: number }> */
        return {
          content: `**Minecraft history and skin for ${name}:**`,
          embeds: [{
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
          }]
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } catch (e) { return { content: 'Enter a valid Minecraft username (account must be premium)', error: true } }
  }
}

// Initialize cache.
let currency: { timestamp: number, rates: Record<string, number> }
export const handleCurrency: Command = {
  name: 'currency',
  aliases: ['cur'],
  opts: {
    description: 'Convert a currency from one currency to another.',
    fullDescription: 'Convert a currency from one currency to another.',
    usage: '/currency (list) <currency symbol to convert from> <currency symbol to convert to> (amount, default: 1)',
    example: '/currency EUR USD 40'
  },
  generator: async (message, args) => {
    // Check cache if old, and refresh accordingly.
    if (!currency || Date.now() - currency.timestamp > 3600000) {
      currency = await ( // This just fetches the data and parses it to JSON.
        await fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
      ).json() as typeof currency
      currency.timestamp = Date.now() // To set the timestamp to the current time of the system.
      // to change syp value to blackmarket value
      const response = await fetch('https://sp-today.com/en/currency/us_dollar/city/damascus')
      const data = await response.text()
      // + 20 to skip the <span class="value"> part.
      const value = data.substring(data.search('<span class="value">') + 20).split('<')[0]
      currency.rates.SYP = Number(value) * currency.rates.USD
    }
    // For /currency list
    if (args.length === 1 && args[0].toLowerCase() === 'list') {
      return {
        content: '**List of symbols:**',
        embeds: [{
          description: Object.keys(currency.rates).toString().split(',').join(', '),
          color: 0x666666,
          title: '💲 Currency symbols',
          fields: [{
            name: 'Tip', value: 'Symbols are usually (but NOT ALWAYS) the country 2 \
letter code + the first letter of the currency name.'
          }]
        }]
      }
    }
    // Calculate the currencies to conver from and to, as well as the amount.
    if (args.length < 2) return { content: 'Invalid usage, use /help currency for proper usage.', error: true }
    let from = args[0].toUpperCase()
    let to = args[1].toUpperCase()
    // If input does not exist as currency, we check if user meant a country name or code instead.
    if (!currency.rates[from]) from = convertToSym(from)
    if (!currency.rates[to]) to = convertToSym(to)
    // Check if everything is in order.
    if (from.length !== 3 || !currency.rates[from]) return { content: 'Invalid currency to convert from.', error: true }
    else if (to.length !== 3 || !currency.rates[to]) return { content: 'Invalid currency to convert to.', error: true }
    else if (!args[2]) args[2] = '1' // If no amount was provided, the amount should be one.
    else if (args[2].search(',') !== -1) args[2] = args[2].split(',').join('') // If user used commas, they should be removed.
    else if (args.length > 3) return { content: 'Enter a single number for currency conversion.', error: true }
    else if (isNaN(+args[2])) return { content: 'Enter a proper number to convert.', error: true }
    // Now we convert the amount.
    const convertedAmount = ((currency.rates[to] / currency.rates[from]) * +args[2])
    const roundedOffAmount = Math.ceil(convertedAmount * Math.pow(10, 4)) / Math.pow(10, 4)
    return `**${from}** ${args[2]} = **${to}** ${roundedOffAmount}`
  }
}

// Our weather and define types.
interface Weather {
  cod: string
  coord: { lon: number, lat: number }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  main: { temp: number, temp_min: number, temp_max: number, humidity: number, pressure: number }
  visibility: number
  wind: { speed: number, deg: number }
  clouds: { all: number }
  rain: { '3h': number }
  snow: { '3h': number }
} /* eslint-enable camelcase */
export const handleWeather: Command = {
  name: 'weather',
  aliases: ['wt'],
  opts: {
    description: 'It\'s really cloudy here..',
    fullDescription: 'What\'s the weather like at your place?',
    usage: '/weather <city name> (country code) (--fahrenheit or -f)',
    example: '/weather Shanghai CN'
  },
  generator: async (message, args) => {
    const fahrenheit = args.includes('--fahrenheit') || args.includes('-f')
    if (fahrenheit) args.splice(args.includes('-f') ? args.indexOf('-f') : args.indexOf('--fahrenheit'), 1)
    // Get the response from our API.
    const weather = await (await fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${args.join(',')}&appid=${weatherAPIkey}${
        fahrenheit ? '&units=imperial' : '&units=metric'
      }`
    )).json() as Weather
    const temp = fahrenheit ? '°F' : '°C'
    // If the place doesn't exist..
    if (weather.cod === '404') return { content: 'Enter a valid city >_<', error: true }
    // We generate the entire embed.
    return {
      content: `**🌇🌃🌁🌆 The weather for ${args.join(', ')}:**`,
      embeds: [{
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
        }, { name: 'Pressure 🍃', value: `${weather.main.pressure} millibars`, inline: true },
        { name: 'Humidity 💧', value: `${weather.main.humidity}%`, inline: true },
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
      }]
    }
  }
}

interface OxfordApiResponse {
  error?: string
  results: Array<{ lexicalEntries: Array<{ inflectionOf: Array<{ id: string }> }> }>
}
type Categories = Array<{
  lexicalCategory: { id: string, text: string }
  entries: Array<{
    senses: Array<{
      definitions: string[]
      shortDefinitions?: string[]
      examples: Array<{ text: string }>
      registers: Array<{ id: string, text: string }>
    }>
  }>
}>
export const handleDefine: Command = {
  name: 'define',
  aliases: ['def'],
  opts: {
    description: 'Define a word in the Oxford Dictionary.',
    fullDescription: 'Define a word in the Oxford Dictionary.',
    usage: '/define <term>',
    example: '/define cyclone'
  },
  generator: async (message, args) => {
    // Setup request to find word.
    const headers = { app_id: oxfordAPI.appId, app_key: oxfordAPI.appKey, Accept: 'application/json' }
    // Search for the word, destructure for results, and then pass them on to our second request.
    try {
      const r = await (await fetch(
        `https://od-api.oxforddictionaries.com/api/v2/lemmas/en/${args.join(' ')}`, { headers }
      )).json() as OxfordApiResponse
      // If the word doesn't exist in the Oxford Dictionary..
      if (r.error === 'No entries were found for a given inflected word' || (
        r.error && r.error.startsWith('No lemma was found')
      )) {
        return { content: 'Did you enter a valid word? 👾', error: true }
      }
      try {
        // Here we get the dictionary entries for the specified word.
        const word = r.results[0].lexicalEntries[0].inflectionOf[0].id
        const { results } = await (await fetch(
          `https://od-api.oxforddictionaries.com/api/v2/entries/en/${word}` +
            '?strictMatch=false&fields=definitions%2Cexamples',
          { headers }
        )).json() as { results: Array<{ lexicalEntries: Categories, word: string }> }
        // Now we create an embed based on the 1st entry.
        const fields: Array<{ name: string, value: string, inline?: boolean }> = []
        // Function to check for maximum number of fields in an embed, then push.
        const safePush = (object: { name: string, value: string }): void => {
          if (fields.length < 24) fields.push(object)
          else if (fields.length === 24) fields.push({ name: '...too many definitions.', value: zeroWidthSpace })
        }
        for (let i = 0; i < results.length; i++) {
          // Our super filter to remove what we don't need.
          const categories: Categories = results[i].lexicalEntries
          categories.forEach(
            // The function run on each category.
            category => {
              // If our field doesn't have the category name, we push the category name to it.
              if (!fields.includes({
                name: '**' + category.lexicalCategory.text + '**', value: zeroWidthSpace
              })) {
                // We don't push an empty field for the first element, else we do.
                if (fields.length !== 0) safePush({ name: zeroWidthSpace, value: zeroWidthSpace })
                safePush({ name: '**' + category.lexicalCategory.text + '**', value: zeroWidthSpace })
              }
              // Here we add every definition and example to the fields.
              let a = 1 // Index for the definition.
              category.entries.forEach(({ senses }) => {
                // Iterate over every definition.
                senses.forEach((sense) => {
                  // Check if there is a definition.
                  if (!sense.shortDefinitions && !sense.definitions) return
                  // Then safely push the definition to the array.
                  safePush({
                    name: `**${a}.** ` + (sense.registers ? `(${sense.registers[0].text}) ` : '') + (
                      (sense.shortDefinitions || sense.definitions)[0]
                    ),
                    value: sense.examples?.[0].text
                      ? `e.g. ${sense.examples[0].text}`
                      : 'No example is available.'
                  })
                  // Add 1 to the index.
                  a += 1
                })
              })
            }
          )
        }
        return {
          content: `📕 **|** Definition of **${args.join(' ')}**:`,
          embeds: [{
            color: 0x7289DA,
            type: 'rich',
            title: results[0].word,
            footer: { text: 'Powered by Oxford Dictionary \\o/' },
            fields
          }]
        }
      } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    } catch (e) { return { content: 'Did you enter a valid word? 👾', error: true } }
  }
}

const noimageposts = ['1037', '1608', '1663']
export const handleXkcd: Command = {
  name: 'xkcd',
  opts: {
    description: 'Get the latest, random or search for an xkcd comic.',
    fullDescription: 'Get the latest, random or search for an xkcd comic.',
    usage: '/xkcd (latest (default)|random|search) (search query, if searching)',
    example: '/xkcd random',
    argsRequired: false
  },
  generator: async (message, args) => {
    if (args.length >= 2 && args[0] === 'search') {
      try {
        // Fetch all posts and parse the HTML.
        const req = await fetch('https://xkcd.com/archive')
        if (!req.ok) return 'Failed to fetch list of xkcd comics!\nhttps://xkcd.com/1348'
        const posts = (await req.text()).split('<br/>').map(e => ({
          name: e.substring(0, e.length - 4).split('>').pop(),
          id: e.substring(e.lastIndexOf('href="/') + 7).split('/"').shift()
        })).slice(4)
        posts.splice(posts.length - 11, 11) // Slice and splice invalid elements.
        // Construct search result. Default threshold was 0.6, 0.4 is more precise.
        const fuse = new Fuse(posts, { keys: ['name', 'id'], threshold: 0.4 })
        const res = fuse.search(args.slice(1).join(' '), { limit: 3 }).map(e => (
          noimageposts.includes(e.item.id) ? { ...e.item, id: e.item.id + '(no image)' } : e.item
        ))
        if (res.length === 0) return { content: 'No results were found for your search criteria!', error: true }
        const res1 = 'https://xkcd.com/' + res[0].id
        const res2 = res[1] ? `\n2. <https://xkcd.com/${res[1].id}>` : ''
        const res3 = res[2] ? `\n3. <https://xkcd.com/${res[2].id}>` : ''
        return `**Top results:**\n1. ${res1}${res2}${res3}`
      } catch (e) { console.error(e); return 'Failed to fetch list of xkcd comics!\nhttps://xkcd.com/1348' }
    } else if (
      args.length > 1 || (args.length === 1 && args[0] !== 'latest' && args[0] !== 'random')
    ) return { content: 'Correct usage: /xkcd (latest|random|search) (search query if searching)', error: true }
    // Get the latest xkcd comic.
    try {
      const { num } = await (await fetch('http://xkcd.com/info.0.json')).json() as { num: number }
      if (args[0] === 'random') return `https://xkcd.com/${Math.floor(Math.random() * (num - 1)) + 1}`
      else return `https://xkcd.com/${num}`
    } catch (e) { return 'Failed to fetch an xkcd comic!\nhttps://xkcd.com/1348' }
  }
}

export const handleHttpCat: Command = {
  name: 'httpcat',
  aliases: ['http.cat'],
  opts: {
    description: 'Get an HTTP cat from https://http.cat',
    fullDescription: 'Get an HTTP cat from https://http.cat',
    example: '/httpcat <HTTP error code>',
    usage: '/httpcat 200',
    argsRequired: false
  },
  generator: async (message, args) => {
    if (isNaN(+args[0]) || args.length > 1) return 'Enter a valid HTTP status code!'

    const req = await fetch('https://http.cat/' + args[0], { method: 'HEAD' })
    if (req.status === 404) return { content: 'Enter a valid HTTP status code!\nhttps://http.cat/404', error: true }

    return 'https://http.cat/' + args[0]
  }
}
