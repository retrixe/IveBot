import { Constants } from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'

export const handleDistort: Command = {
  name: 'distort',
  opts: {
    description: 'Pretty distorted text.',
    fullDescription: 'Pretty distorted text.',
    usage: '/distort <text>',
    example: '/distort lol',
    options: [
      {
        name: 'text',
        description: 'The text to be distorted.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: interaction =>
    (interaction.data.options[0] as InteractionDataOptionsString).value
      .split(' ')
      .map((i: string) => i.split('').join('*') + (i.length % 2 === 0 ? '*' : ''))
      .join(' '),
  generator: (message, args) =>
    args.map(i => i.split('').join('*') + (i.length % 2 === 0 ? '*' : '')).join(' '),
}
