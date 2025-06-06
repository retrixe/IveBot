// All the types!
import type Dysnomia from '@projectdysnomia/dysnomia'
import type { SlashCommand } from '../../../imports/types.ts'

const generator = async (guild: string, client: Dysnomia.Client) =>
  'Available voice regions for this server: `' +
  (await client.getVoiceRegions(guild)).map(value => value.id).join('`, `') +
  '`'

export const handleListvoiceregions: SlashCommand = {
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
  slashGenerator: async ({ guild: { id: guildID } }, options, { client }) =>
    await generator(guildID, client),
  generator: async (message, args, { client }) => await generator(message.guildID, client),
}
