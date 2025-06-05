import { Constants } from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'

export const handleReverse: Command = {
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
  slashGenerator: interaction =>
    (interaction.data.options[0] as InteractionDataOptionsString).value
      .split('')
      .reverse()
      .join(''),
  generator: (message, args) => args.join(' ').split('').reverse().join(''),
}
