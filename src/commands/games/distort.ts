import { Constants } from '@projectdysnomia/dysnomia'
import type { SlashCommand } from '../../imports/types.ts'

export const handleDistort: SlashCommand<{ text: string }> = {
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
  slashGenerator: (interaction, options) =>
    options.text
      .split(' ')
      .map(i => i.split('').join('*') + (i.length % 2 === 0 ? '*' : ''))
      .join(' '),
  generator: (message, args) =>
    args.map(i => i.split('').join('*') + (i.length % 2 === 0 ? '*' : '')).join(' '),
}
