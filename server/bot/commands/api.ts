// All the types!
import { IveBotCommand } from '../imports/types'
// All the tools!
import * as fetch from 'isomorphic-unfetch'
// Get the NASA API token.
import 'json5/lib/require'

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
