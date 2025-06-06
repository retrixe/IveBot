// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type { SlashCommand } from '../../imports/types.ts'
// All the needs!
import { evaluate } from 'mathjs'

const generator = (expression: string) => {
  try {
    return `${evaluate(expression.split(',').join('.').split('÷').join('/').toLowerCase())}`.trim()
  } catch {
    return { content: 'Invalid expression >_<', error: true }
  }
}

export const handleCalculate: SlashCommand<{ expression: string }> = {
  name: 'calculate',
  aliases: ['calc', 'cal'],
  opts: {
    description: 'Calculate an expression.',
    fullDescription: `Calculate the value of an expression.
More info here: https://mathjs.org/docs/expressions/syntax.html`,
    usage: '/calculate <expression>',
    example: '/calculate 2 + 2',
    invalidUsageMessage: 'Specify an expression >_<',
    options: [
      {
        name: 'expression',
        description: 'The math expression to be evaluated.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: (interaction, { expression }) => generator(expression),
  generator: (message, args) => generator(args.join(' ')),
}
