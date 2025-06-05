// All the types!
import type { Command } from '../../imports/types.ts'

export const handleUrban: Command = {
  name: 'urban',
  aliases: ['urb'],
  opts: {
    description: 'Get an Urban Dictionary definition ;)',
    fullDescription: 'Get an Urban Dictionary definition ;)',
    usage: '/urban <term>',
    example: '/urban nub',
    argsRequired: false, // this is fun.
  },
  generator: async (message, args) => {
    try {
      // Fetch the definition and parse it to JSON.
      const { list } = (await (
        await fetch(`http://api.urbandictionary.com/v0/define?term=${args.join(' ')}`)
      ).json()) as { list: Array<{ definition: string }> }
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
          embeds: [
            {
              color: 0x555555,
              description: response,
              footer: { text: 'Do not trust Urban Dictionary.' },
              title: args.join(' '),
            },
          ],
        }
        // Else, there will be an exception thrown.
      } catch (err) {
        return { content: 'No definition was found.', error: true }
      }
    } catch (e) {
      return `Something went wrong 👾 Error: ${e}`
    }
  },
}
