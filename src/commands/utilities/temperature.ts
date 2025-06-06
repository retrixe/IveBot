// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'

const cToF = (c: number): number => +((c * 9) / 5 + 32).toFixed(2)
const cToK = (c: number): number => +(c + 273.15).toFixed(2)
const fToC = (f: number): number => +(((f - 32) * 5) / 9).toFixed(2)
const kToC = (k: number): number => +(k - 273.15).toFixed(2)

const generator = (temp: string) => {
  const regex = /^(-?\d+.?\d*) ?°? ?([CFK])$/i
  const match = regex.exec(temp)
  if (!match) return { content: 'Specify a temperature ending in C, F or K.', error: true }
  const value = +match[1]
  const unit = match[2].toLowerCase()
  const result = `**${value}°${unit.toUpperCase()}** is:`
  if (unit === 'c') {
    return result + `\n**${cToF(value)}°F** (Fahrenheit)` + `\n**${cToK(value)}K** (Kelvin)`
  } else if (unit === 'f') {
    return result + `\n**${fToC(value)}°C** (Celsius)` + `\n**${cToK(fToC(value))}K** (Kelvin)`
  } else {
    return result + `\n**${kToC(value)}°C** (Celsius)` + `\n**${cToF(kToC(value))}°F** (Fahrenheit)`
  }
}

export const handleTemperature: Command = {
  name: 'temperature',
  aliases: ['temp'],
  opts: {
    description: 'Convert between temperature units.',
    fullDescription: 'Convert between temperature units.',
    usage: '/temperature <temperature>',
    example: '/temperature 100C',
    invalidUsageMessage: 'Specify a temperature ending in C, F or K.',
    options: [
      {
        name: 'temperature',
        description: 'The temperature to be converted, ending in C, F or K.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: interaction =>
    generator((interaction.data.options[0] as InteractionDataOptionsString).value),
  generator: (message, args) => generator(args[0]),
}
