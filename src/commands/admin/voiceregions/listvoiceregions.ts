// All the types!
import type Dysnomia from '@projectdysnomia/dysnomia'
import type { Command } from '../../../imports/types.ts'
// All the needs!
import { getChannel } from '../../../imports/tools.ts'

export const handleListvoiceregions: Command = {
  name: 'listvoiceregions',
  aliases: ['lsr', 'lvr'],
  opts: {
    fullDescription: 'List available voice regions.',
    description: 'List available voice regions.',
    usage: '/listvoiceregions',
    example: '/listvoiceregions',
    guildOnly: true,
    argsRequired: false,
  },
  slashGenerator: async ({ guildID }, { client }) =>
    await handleListvoiceregions.commonGenerator(guildID, client),
  generator: async (message, args, { client }) =>
    await handleListvoiceregions.commonGenerator(message.guildID, client),
  commonGenerator: async (guild: string, client: Dysnomia.Client) =>
    'Available voice regions for this server: `' +
    (await client.getVoiceRegions(guild)).map(value => value.id).join('`, `') +
    '`',
}
