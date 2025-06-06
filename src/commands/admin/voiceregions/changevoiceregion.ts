// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type Dysnomia from '@projectdysnomia/dysnomia'
import type { InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import type { Command } from '../../../imports/types.ts'
// All the needs!
import { getChannel } from '../../../imports/tools.ts'

const generator = async (channel: Dysnomia.VoiceChannel, region: string) => {
  try {
    const { rtcRegion } = await channel.edit({
      rtcRegion: region === 'automatic' || region === 'auto' ? null : region,
    })
    return 'Voice region changed to ' + (rtcRegion || 'auto') + ' \\o/'
  } catch {
    return 'Invalid voice region.'
  }
}

export const handleChangevoiceregion: Command = {
  name: 'changevoiceregion',
  aliases: ['csr', 'cvr'],
  opts: {
    fullDescription: 'Changes the voice region of the voice channel.',
    description: 'Changes the voice region of the voice channel.',
    usage: '/changevoiceregion <voice channel name> <voice region or automatic>',
    example: '/changevoiceregion General 1 russia',
    guildOnly: true,
    requirements: {
      permissions: { manageGuild: true },
    },
    options: [
      {
        name: 'channel',
        description: 'The voice channel to edit the region of.',
        type: Constants.ApplicationCommandOptionTypes.CHANNEL,
        channel_types: [
          Constants.ChannelTypes.GUILD_VOICE,
          Constants.ChannelTypes.GUILD_STAGE_VOICE,
        ],
        required: true,
      },
      {
        name: 'region',
        description: 'The voice region to switch the channel to. Use /listvoiceregions.',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true,
      },
    ],
  },
  slashGenerator: async (interaction, { client }) => {
    const channelOpt = interaction.data.options.find(
      option => option.name === 'channel',
    ) as Dysnomia.InteractionDataOptionsChannel
    const regionOpt = interaction.data.options.find(
      option => option.name === 'region',
    ) as InteractionDataOptionsString
    const ch = client.guilds.get(interaction.guild?.id).channels.get(channelOpt.value)
    if (!ch || ch.type !== 2) return { content: 'This voice channel does not exist!', error: true }
    return await generator(ch, regionOpt.value || 'auto')
  },
  generator: async (message, args, { client }) => {
    if (!message.member.guild.members.get(client.user.id).permissions.has('manageGuild')) {
      return 'I require the Manage Server permission to do that..'
    }
    const rtcRegion = args.pop()
    const ch = getChannel(message, args.join(' '))
    if (!ch || ch.type !== 2) return { content: 'This voice channel does not exist!', error: true }
    return await generator(ch, rtcRegion)
  },
}
