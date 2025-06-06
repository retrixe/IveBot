import { Constants } from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
import { characters } from './zalgo.ts'

const generator = (text: string) => {
  let newMessage = ''
  text.split('').forEach(element => {
    if (!characters.includes(element)) newMessage += element
  })
  return newMessage
}

export const handleDezalgo: Command = {
  name: 'dezalgo',
  aliases: ['dzgo'],
  opts: {
    description: "The zalgo demon's writing.",
    fullDescription: "Read the zalgo demon's writing.",
    usage: '/dezalgo <text>',
    example: '/dezalgo ḥ̛̓e̖l̽͞҉lͦͅoͥ',
    options: [
      {
        name: 'text',
        description: "The zalgo demon's handwriting to be converted to regular text.",
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: interaction =>
    generator((interaction.data.options[0] as InteractionDataOptionsString).value),
  generator: (message, args) => generator(args.join(' ')),
}
