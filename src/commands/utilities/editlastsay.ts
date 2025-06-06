// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getIdFromMention, getInsult } from '../../imports/tools.ts'
import { host, testPilots } from '../../config.ts'

export const handleEditLastSay: Command = {
  name: 'editLastSay',
  aliases: ['els'],
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    description: 'Edits the last say in a channel.',
    fullDescription: 'Edits the last say in a channel. Test pilots and admins/mods only.',
    usage: '/editLastSay (channel) <new text>',
    example: '/editLastSay #general hey',
    deleteCommand: true,
  },
  generator: async (message, args, { tempDB, client }) => {
    // Is the edit for another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (
      message.channelMentions[0] === possibleChannel ||
      message.member?.guild.channels.has(possibleChannel)
    ) {
      if (
        message.member &&
        !message.member.guild.channels
          .get(possibleChannel)
          .permissionsOf(message.member.id)
          .has('sendMessages')
      )
        return {
          content: `**You don't have enough permissions for that, you ${getInsult()}.**`,
          error: true,
        }
      // Edit the message.
      try {
        await client.editMessage(
          possibleChannel,
          tempDB.say.get(possibleChannel),
          args.slice(1).join(' '),
        )
      } catch {
        return { content: 'Nothing to edit.', error: true }
      }
      return
    }
    // Edit the message.
    try {
      await client.editMessage(
        message.channel.id,
        tempDB.say.get(message.channel.id),
        args.join(' '),
      )
    } catch {
      return { content: 'Nothing to edit.', error: true }
    }
  },
}
