import type { Command } from '../../imports/types.ts'
import { getInsult } from '../../imports/tools.ts'
import type { GuildTextableChannel } from '@projectdysnomia/dysnomia'

export const handleSlowmode: Command = {
  name: 'slowmode',
  aliases: ['sm'],
  opts: {
    description: 'When you must slow down chat.',
    fullDescription: 'When you must slow down chat.',
    usage: '/slowmode <number in seconds, max: 120 or off>',
    guildOnly: true,
    example: '/slowmode off',
    requirements: {
      permissions: { manageChannels: true },
      custom: message => {
        const permissions = (message.channel as GuildTextableChannel).permissionsOf(
          message.author.id,
        )
        return permissions.has('manageChannels') || permissions.has('manageMessages')
      },
    },
  },
  generator: async (message, args, { client }) => {
    const t = +args[0]
    if ((isNaN(t) && args[0] !== 'off') || !args[0] || t < 0 || t > 120 || args.length > 1) {
      return 'Correct usage: /slowmode <number in seconds, max: 120 or off>'
    }
    // Check bot for permissions.
    const permission = (message.channel as GuildTextableChannel).permissionsOf(client.user.id)
    if (!permission.has('manageMessages') && !permission.has('manageChannels')) {
      return `I lack permission to set slowmode in this channel, you ${getInsult()}.`
    }
    // Set slowmode.
    try {
      await client.editChannel(message.channel.id, { rateLimitPerUser: isNaN(t) ? 0 : t })
    } catch (e) {
      return 'I cannot use slowmode >_<'
    }
    return `Successfully set slowmode to ${isNaN(t) || t === 0 ? 'off' : `${t} seconds`} 👌`
  },
}
