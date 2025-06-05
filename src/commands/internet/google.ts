// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import { Constants, type InteractionDataOptionsString } from '@projectdysnomia/dysnomia'

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
        required: true,
      },
    ],
  },
  generator: (message, args) =>
    `https://lmgtfy.com/?q=${encodeURIComponent(args.join(' ')).replace(/%20/g, '+')}`,
  slashGenerator: interaction =>
    `https://lmgtfy.com/?q=${encodeURIComponent(
      (interaction.data.options[0] as InteractionDataOptionsString).value,
    ).replace(/%20/g, '+')}`,
}
