// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
// All the needs!
import ms from 'ms'
import { host, testPilots } from '../../config.ts'

export const handleRequest: Command = {
  name: 'request',
  aliases: ['req', 'suggest'],
  opts: {
    description: 'Request a specific feature.',
    fullDescription: 'Request a feature. 24 hour cooldown except for test pilots.',
    usage: '/request <suggestion>',
    example: '/request a /userinfo command.',
    options: [
      {
        name: 'suggestion',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
        description:
          'The feature you want to suggest, or the bug you wish to report. Please be detailed.',
      },
    ],
  },
  generator: async ({ author }, args, { client, tempDB }) => {
    // Check for cooldown.
    if (
      !testPilots.includes(author.id) &&
      host !== author.id &&
      tempDB.cooldowns.request.has(author.id)
    )
      return 'This command is cooling down right now. Try again later.'
    await client.createMessage(
      (await client.getDMChannel(host)).id,
      `${author.username}#${author.discriminator} with ID ${author.id}: ${args.join(' ')}`,
    )
    // Add cooldown.
    if (!testPilots.includes(author.id) && host !== author.id) {
      tempDB.cooldowns.request.add(author.id)
      setTimeout(() => tempDB.cooldowns.request.delete(author.id), ms('1 day'))
    }
    // Confirm the request.
    return `${author.mention}, what a pathetic idea. It has been DMed to the main developer \
and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`
  },
}
