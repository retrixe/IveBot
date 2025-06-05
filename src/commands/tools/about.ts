import type { Command } from '../../imports/types.ts'
import { readFile } from 'fs/promises'

const { version }: { version: string } = JSON.parse(
  await readFile('package.json', { encoding: 'utf8' }),
)

export const handleAbout: Command = {
  name: 'about',
  opts: {
    description: 'About IveBot.',
    fullDescription: 'About IveBot.',
    usage: '/about',
    example: '/about',
    argsRequired: false,
  },
  generator: `**IveBot ${version}**
IveBot is a Discord bot written with Dysnomia (Eris continuation) and care.
Unlike most other dumb bots, IveBot was not written with discord.js and has 0% copied code.
Built with community feedback mainly, IveBot does a lot of random stuff and fun.
IveBot 4.0 made a lot of changes under the hood and added support for new Discord features.
For information on what IveBot can do, type **/help** or **/halp**.
The source code can be found here: <https://github.com/retrixe/IveBot>
For noobs, this bot is licensed and protected by law. Copy code and I will sue you for a KitKat.`,
}
