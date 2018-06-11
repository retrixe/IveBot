// All the types!
import { IveBotCommand } from '../imports/types'
// All the tools!
import * as fetch from 'isomorphic-unfetch'
import * as moment from 'moment'
import { zeroWidthSpace } from '../imports/tools'
// Get the NASA API token.
import 'json5/lib/require'
import { NASAtoken } from '../../../config.json5'

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
