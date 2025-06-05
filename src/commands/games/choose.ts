import { Constants } from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'

export const handleChoose: Command = {
  name: 'choose',
  aliases: ['cho'],
  opts: {
    description: 'Choose between multiple options.',
    fullDescription: 'Choose between multiple options.',
    example: '/choose cake|ice cream|pasta',
    usage: '/choose <option 1>|(option 2)|(option 3)...',
    options: [
      {
        name: 'choices',
        description:
          'The choices to choose from. Each option should be separated like: item1|item2',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: interaction => {
    const choices = (interaction.data.options[0] as InteractionDataOptionsString).value.split('|')
    return `I choose: ${choices[Math.floor(Math.random() * choices.length)]}`
  },
  generator: (message, args) => {
    // Is it used correctly?
    if (message.content.split('|').length === 1)
      return { content: 'Correct usage: /choose item1|item2|...', error: true }
    const choices = args.join(' ').split('|')
    return `I choose: ${choices[Math.floor(Math.random() * choices.length)]}`
  },
}
