import type { Command } from '../../../imports/types.ts'
import { getChannel, getInsult } from '../../../imports/tools.ts'

export const handleDeletechannel: Command = {
  name: 'deleteChannel',
  aliases: ['dc', 'removechannel'],
  opts: {
    description: 'Remove a channel from the server.',
    fullDescription: 'Remove a channel from the server.',
    usage: '/deletechannel <channel by ID/mention/name> (reason)',
    example: '/deletechannel ok Accidentally made.',
    guildOnly: true,
    requirements: { permissions: { manageChannels: true } },
  },
  generator: async (message, args, { client }) => {
    // Get the channel ID.
    const channel = getChannel(message, args.shift())
    if (!channel) return { content: `Specify a valid channel, you ${getInsult()}!`, error: true }
    // If no permission to manage channels, say it.
    if (!message.member.guild.members.get(client.user.id).permissions.has('manageChannels')) {
      return { content: "I can't even delete that channel, you " + getInsult() + '.', error: true }
    }
    // Delete it.
    try {
      await channel.delete(args.join(' '))
    } catch (e) {
      return 'I was unable to delete that channel >_<'
    }
    // Confirm the delete.
    return `Channel \`${channel.name}\` deleted.`
  },
}
