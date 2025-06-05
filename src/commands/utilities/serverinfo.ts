// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type { Guild, InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getInsult } from '../../imports/tools.ts'
import moment from 'moment'

export const handleServerinfo: Command = {
  name: 'serverinfo',
  aliases: ['serveri', 'guildinfo', 'si'],
  opts: {
    description: 'Displays info on the current servers.',
    fullDescription: 'Displays info on the current servers (or other mutual servers).',
    example: '/serverinfo',
    usage: '/serverinfo (mutual server ID)',
    argsRequired: false,
    options: [
      {
        name: 'server',
        required: false,
        description: 'A server you share with IveBot.',
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },

  slashGenerator: async (interaction, { client }) => {
    const serverOpt = (interaction.data.options[0] as InteractionDataOptionsString)?.value
    let guild = client.guilds.get(serverOpt || interaction.guildID)
    if (serverOpt && guild && !guild.members.has(interaction.user.id)) guild = undefined
    return await handleServerinfo.commonGenerator(guild)
  },
  generator: async (message, args, { client }) => {
    let guild = args.length > 0 ? client.guilds.get(args[0]) : message.member.guild
    if (args.length > 0 && guild && !guild.members.has(message.author.id)) guild = undefined
    return await handleServerinfo.commonGenerator(guild)
  },
  commonGenerator: (guild: Guild) => {
    if (!guild) return { content: `Specify a valid mutual guild, ${getInsult()}.`, error: true }
    // Owner.
    const owner = guild.members.get(guild.ownerID)
    // Nitro Boosting support.
    const boost = guild.premiumSubscriptionCount
      ? [
          {
            name: '<:boost:602100826214760452> Boost Status',
            value: `Level ${guild.premiumTier || 0} with ${guild.premiumSubscriptionCount} Boosts`,
            inline: true,
          },
        ]
      : []
    // Display information.
    return {
      content: `⌨ **Server info on ${guild.name}:**`,
      embeds: [
        {
          author: { name: guild.name, icon_url: guild.iconURL },
          thumbnail: { url: guild.iconURL },
          color: Math.floor(Math.random() * 1000000 - 1),
          footer: { text: `ID: ${guild.id}` },
          timestamp: new Date().toISOString(),
          fields: [
            ...boost,
            { name: 'Owner', value: `${owner.username}#${owner.discriminator}`, inline: true },
            { name: 'Owner ID', value: guild.ownerID, inline: true },
            // { name: 'Region', value: guild.region, inline: true },
            {
              name: 'Created On',
              value: moment(guild.createdAt).format('DD/MM/YYYY, hh:mm:ss A'),
              inline: true,
            },
            {
              name: 'Channel Categories',
              inline: true,
              value: guild.channels.filter(i => i.type === 4).length.toString(),
            },
            {
              name: 'Text Channels',
              inline: true,
              value: guild.channels.filter(i => i.type === 0).length.toString(),
            },
            {
              name: 'Voice Channels',
              inline: true,
              value: guild.channels.filter(i => i.type === 2).length.toString(),
            },
            { name: 'Members', inline: true, value: guild.memberCount.toString() },
            {
              name: 'Humans',
              inline: true,
              value: guild.members.filter(i => !i.bot).length.toString(),
            },
            {
              name: 'Bots',
              inline: true,
              value: guild.members.filter(i => i.bot).length.toString(),
            },
            { name: 'Roles', inline: true, value: guild.roles.size.toString() },
          ],
        },
      ],
    }
  },
}
