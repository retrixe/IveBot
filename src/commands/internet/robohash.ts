// All the types!
import type { Command } from '../../imports/types.ts'

export const handleRobohash: Command = {
  name: 'robohash',
  aliases: ['robo', 'rh'],
  opts: {
    description: 'Take some text, make it a robot/monster/head/cat/human.',
    fullDescription: 'Takes some text and hashes it in the form of an image :P',
    usage: '/robohash <cat/robot/monster/head/human> <text to hash>',
    example: '/robohash cat voldemort#6931',
  },
  generator: (message, args) => {
    // Get text to hash.
    const target = args.shift().toLowerCase()
    const text = args.join('%20')
    // Send a robohash.
    const color = 0xcf1c1c
    if (target === 'robot') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png` }, color }],
        content: '🤖',
      }
    } else if (target === 'monster') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set2` }, color }],
        content: '👾',
      }
    } else if (target === 'head') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set3` }, color }],
      }
    } else if (target === 'cat') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set4` }, color }],
      }
    } else if (target === 'human') {
      return {
        embeds: [{ image: { url: `https://robohash.org/${text}.png?set=set5` }, color }],
        content: '🤔',
      }
    } else {
      return {
        content: 'Correct usage: /robohash <robot, monster, head, cat, human> <text to robohash>',
        error: true,
      }
    }
  },
}
