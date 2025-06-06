import { Constants } from '@projectdysnomia/dysnomia'
import type {
  InteractionDataOptionsInteger,
  InteractionDataOptionsString,
} from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'

const generator = (number: number, text: string) => {
  if (number * text.length >= 2001) {
    return {
      content: 'To prevent spam, your excessive message has not been repeated.',
      error: true,
    }
  } else if (text === '_' || text === '*' || text === '~') {
    return { content: 'This is known to lag users and is disabled.', error: true }
  }
  let generatedMessage = ''
  for (let x = 0; x < number; x++) {
    generatedMessage += text
  }
  return generatedMessage
}

export const handleRepeat: Command = {
  name: 'repeat',
  aliases: ['rep'],
  opts: {
    description: 'Repeat a string.',
    fullDescription: 'Repeat a string.',
    usage: '/repeat <number of times> <string to repeat>',
    example: '/repeat 10 a',
    options: [
      {
        name: 'number',
        description: 'The number of times to repeat the text.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: 'text',
        description: 'The text to repeat as many times as you want.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: interaction => {
    const number = (
      interaction.data.options.find(opt => opt.name === 'number') as InteractionDataOptionsInteger
    ).value
    const text = (
      interaction.data.options.find(opt => opt.name === 'text') as InteractionDataOptionsString
    ).value
    return generator(number, text)
  },
  generator: (message, args) => {
    // All arguments.
    const number = +args.shift()
    if (isNaN(number)) return 'Correct usage: /repeat <number of times> <string to repeat>'
    return generator(number, args.join(' '))
  },
}
