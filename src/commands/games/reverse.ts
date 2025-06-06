import { Constants } from '@projectdysnomia/dysnomia'
import type { SlashCommand } from '../../imports/types.ts'

export const handleReverse: SlashCommand<{ text: string }> = {
  name: 'reverse',
  aliases: ['rev'],
  opts: {
    description: 'Reverse a sentence.',
    fullDescription: 'Reverse a sentence.',
    example: '/reverse hello',
    usage: '/reverse <text>',
    options: [
      {
        name: 'text',
        description: 'The text to reverse.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: (interaction, { text }) => text.split('').reverse().join(''),
  generator: (message, args) => args.join(' ').split('').reverse().join(''),
}
