import type { Command } from '../../imports/types.ts'
import { readFile } from 'fs/promises'

const { version }: { version: string } = JSON.parse(
  await readFile('package.json', { encoding: 'utf8' }),
)

export const handleVersion: Command = {
  name: 'version',
  aliases: ['ver'],
  opts: {
    description: 'Current running version of IveBot.',
    fullDescription: 'Current running version of IveBot.',
    usage: '/version',
    example: '/version',
    argsRequired: false,
  },
  generator: `**IveBot ${version}**`,
}
