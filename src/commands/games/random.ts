import { Constants } from '@projectdysnomia/dysnomia'
import type { SlashCommand } from '../../imports/types.ts'

export const handleRandom: SlashCommand<{ start?: number; end?: number }> = {
  name: 'random',
  aliases: ['rand'],
  opts: {
    description: 'Return a random number.',
    fullDescription: 'Returns a random number, by default between 0 and 10.',
    usage: '/random (starting number) (ending number)',
    example: '/random 1 69',
    argsRequired: false,
    options: [
      {
        name: 'start',
        description: 'The number which the random number should be higher than or equal to.',
        required: false,
        type: Constants.ApplicationCommandOptionTypes.INTEGER,
      },
      {
        name: 'end',
        description: 'The number which the random number should be lower than.',
        required: false,
        type: Constants.ApplicationCommandOptionTypes.INTEGER,
      },
    ],
  },
  slashGenerator: (interaction, { start, end }) => {
    if (typeof start === 'number' && typeof end === 'number') {
      return `The number.. is.. ${Math.floor(Math.random() * (end - start)) + start}`
    } else if (typeof end === 'number') {
      return `The number.. is.. ${Math.floor(Math.random() * end)}`
    } else if (typeof start === 'number') {
      return { content: 'You must provide an end number if providing a start number.', error: true }
    } else return `The number.. is.. ${Math.floor(Math.random() * 10)}`
  },
  generator: (message, args) => {
    // If argument length is 1 and the argument is a number..
    if (args.length === 1 && !isNaN(+args[0])) {
      const number = +args[0]
      return `The number.. is.. ${Math.floor(Math.random() * number)}`
      // If argument length is 2 and both arguments are numbers..
    } else if (args.length === 2 && !isNaN(+args[0]) && !isNaN(+args[1])) {
      const number1 = +args[0]
      const number2 = +args[1]
      return `The number.. is.. ${Math.floor(Math.random() * (number2 - number1)) + number1}`
    } else if (args.length >= 1) {
      return {
        content: 'Correct usage: /random (optional start number) (optional end number)',
        error: true,
      }
    }
    return `The number.. is.. ${Math.floor(Math.random() * 10)}`
  },
}
