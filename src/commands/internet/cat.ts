// All the types!
import { formatError } from '../../imports/tools.ts'
import type { SlashCommand } from '../../imports/types.ts'

export const handleCat: SlashCommand = {
  name: 'cat',
  opts: {
    description: 'Random cat from <https://random.cat>',
    fullDescription: 'Random cat from <https://random.cat>',
    usage: '/cat',
    example: '/cat',
    argsRequired: false,
  },
  slashGenerator: true,
  generator: async () => {
    try {
      // Fetch a cat and process it (this sounds funny to me idk why)
      const { file } = (await (await fetch('http://aws.random.cat/meow')).json()) as {
        file: string
      }
      // Send it.
      return { embeds: [{ image: { url: file }, color: 0x123456 }], content: '🐱' }
    } catch (e) {
      return `Something went wrong 👾 Error: ${formatError(e)}`
    }
  },
}
