import { Constants } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'

export const handle8ball: Command = {
  name: '8ball',
  opts: {
    description: 'Random answers to random questions.',
    fullDescription: 'Random answers to random questions.',
    usage: '/8ball <question>',
    example: '/8ball Will I flunk my exam?',
    invalidUsageMessage: 'Please ask the 8ball a question.',
    options: [
      {
        name: 'question',
        description: 'The question you wish to ask the 8ball.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: true,
  generator: () => {
    // Possible responses, taken from Diary Of A Wimpy Kid: Hard Luck.
    const responses = [
      'It is certain.',
      'It is decidedly so.',
      'Better not tell you now.',
      'My sources say no.',
      'Without a doubt.',
      'Concentrate and ask again.',
      'My reply is no.',
      'No.',
      'Yes, definitely.',
      'Ask again later.',
      'Reply hazy, try again later.',
    ]
    // Respond.
    return `The 🎱 has spoken.
8ball: ${responses[Math.floor(Math.random() * responses.length)]}`
  },
}
