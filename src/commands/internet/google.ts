// All the types!
import type { SlashCommand } from '../../imports/types.ts'
// All the tools!
import { Constants } from '@projectdysnomia/dysnomia'

export const handleGoogle: SlashCommand<{ query: string }> = {
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
        required: true,
      },
    ],
  },
  generator: (message, args) =>
    `https://lmgtfy.com/?q=${encodeURIComponent(args.join(' ')).replace(/%20/g, '+')}`,
  slashGenerator: (interaction, options) =>
    `https://lmgtfy.com/?q=${encodeURIComponent(options.query).replace(/%20/g, '+')}`,
}
