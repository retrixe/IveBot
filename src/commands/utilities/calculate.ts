// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
// All the needs!
import { evaluate } from 'mathjs'

export const handleCalculate: Command = {
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
  slashGenerator: async interaction =>
    await handleCalculate.commonGenerator(
      (interaction.data.options[0] as InteractionDataOptionsString).value,
    ),
  generator: async (message, args) => await handleCalculate.commonGenerator(args.join(' ')),
  commonGenerator: (expression: string) => {
    try {
      return `${evaluate(expression.split(',').join('.').split('÷').join('/').toLowerCase())}`.trim()
    } catch (e) {
      return { content: 'Invalid expression >_<', error: true }
    }
  },
}
