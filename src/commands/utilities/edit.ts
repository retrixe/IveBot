// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getIdFromMention } from '../../imports/tools.ts'
import { host } from '../../config.ts'

export const handleEdit: Command = {
  name: 'edit',
  opts: {
    requirements: { userIDs: [host] },
    description: 'Edits a single message.',
    fullDescription: 'Edits a single message. Owner only command.',
    usage: '/edit (channel) <message ID> <new text>',
    example: '/edit #general 123456789012345678 hi',
    deleteCommand: true,
  },
  generator: async (message, args, { client }) => {
    // Should it be edited in another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (
      message.channelMentions[0] === possibleChannel ||
      message.member?.guild.channels.has(possibleChannel)
    ) {
      // if (message.member && !message.member.guild.channels.get(possibleChannel)
      //   .permissionsOf(message.member.id).has('sendMessages')
      // ) return `**You don't have enough permissions for that, you ${getInsult()}.**`
      const messageID = args.slice(1).shift()
      try {
        await client.editMessage(possibleChannel, messageID, args.slice(1).join(' '))
      } catch (e) {
        return { content: 'Nothing to edit.', error: true }
      }
      return
    }
    // Edit the message.
    const messageID = args.shift()
    try {
      await client.editMessage(message.channel.id, messageID, args.join(' '))
    } catch (e) {
      return { content: 'Nothing to edit.', error: true }
    }
  },
}
