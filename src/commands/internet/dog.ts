// All the types!
import { formatError } from '../../imports/tools.ts'
import type { Command } from '../../imports/types.ts'

export const handleDog: Command = {
  name: 'dog',
  opts: {
    description: 'Random dog from <https://dog.ceo>',
    fullDescription: 'Random dog from <https://dog.ceo>',
    usage: '/dog (list) (breed, works with random image AND list) (sub-breed ONLY without list)',
    example: '/dog list | /dog labrador | /dog',
    argsRequired: false,
  },
  generator: async (message, args) => {
    // List of breeds.
    if (args[0] === 'list') {
      try {
        const { message } = (await (await fetch('https://dog.ceo/api/breeds/list/all')).json()) as {
          message: Record<string, string[]>
        }
        // If only list of breeds was asked.
        if (!args[1]) return `**List of breeds:** ${Object.keys(message).join(', ')}`
        // If list of sub-breeds was asked.
        if (!message[args[1]]) {
          return { content: 'This breed does not exist!', error: true }
        } else if (message[args[1]].length === 0) {
          return { content: 'This breed has no sub-breeds!', error: true }
        } else {
          return `**List of sub-breeds:** ${message[args[1]].join(', ')}`
        }
      } catch (err) {
        return `Something went wrong 👾 Error: ${formatError(err)}`
      }
      // Fetch a random picture for a sub-breed.
    } else if (args[0] && args[1]) {
      try {
        let { message } = (await (
          await fetch(
            `http://dog.ceo/api/breed/${args[0].toLowerCase()}/${args[1].toLowerCase()}/images/random`,
          )
        ).json()) as { message: string }
        if (message.includes('Breed not found')) {
          ;({ message } = (await (
            await fetch(`http://dog.ceo/api/breed/${args.join('').toLowerCase()}/images/random`)
          ).json()) as { message: string })
        }
        if (!message || message.includes('Breed not found'))
          return { content: 'This breed/sub-breed does not exist!', error: true }
        return {
          embeds: [{ image: { url: message }, color: 0x654321 }],
          content: `🐕 ${args[0]} ${args[1]}`,
        }
      } catch (err) {
        return `Something went wrong 👾 Error: ${formatError(err)}`
      }
    } else if (args[0]) {
      // Fetch a random picture for a breed.
      try {
        const { message } = (await (
          await fetch(`http://dog.ceo/api/breed/${args[0].toLowerCase()}/images/random`)
        ).json()) as { message: string }
        if (!message || message.includes('Breed not found')) return 'This breed does not exist!'
        return { embeds: [{ image: { url: message }, color: 0x654321 }], content: '🐕 ' + args[0] }
      } catch (err) {
        return `Something went wrong 👾 Error: ${formatError(err)}`
      }
    }
    // Fetch a random picture.
    try {
      const { message } = (await (
        await fetch('http://dog.ceo/api/breeds/image/random')
      ).json()) as { message: string }
      return { embeds: [{ image: { url: message }, color: 0x654321 }], content: '🐕' }
    } catch (err) {
      return `Something went wrong 👾 Error: ${formatError(err)}`
    }
  },
}
