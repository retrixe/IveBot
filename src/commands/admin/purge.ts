import type { Command } from '../../imports/types.ts'
import { getInsult } from '../../imports/tools.ts'
import type { Message, GuildTextableChannel } from '@projectdysnomia/dysnomia'

export const handlePurge: Command = {
  name: 'purge',
  opts: {
    description: 'Bulk delete a set of messages.',
    fullDescription: 'Bulk delete messages newer than 2 weeks.',
    usage: '/purge <number greater than 0 and less than 100>',
    example: '/purge 10',
    guildOnly: true,
    deleteCommand: true,
    requirements: {
      permissions: { manageMessages: true },
      custom: message =>
        (message.channel as GuildTextableChannel)
          .permissionsOf(message.author.id)
          .has('manageMessages'),
    },
  },
  generator: async (message, args, { client }) => {
    // Check if usage is correct.
    if (isNaN(+args[0]) || args.length !== 1 || +args[0] <= 0 || +args[0] > 100) {
      return {
        content: 'Correct usage: /purge <number greater than 0 and less than 100>',
        error: true,
      }
    }
    // Check bot for permissions.
    const permission = (message.channel as GuildTextableChannel).permissionsOf(client.user.id)
    if (!permission.has('manageMessages')) {
      return `I lack permission to purge messages in this channel, you ${getInsult()}.`
    }
    // Pre-defined variables.
    let messages: Message[]
    // Get the list of messages.
    try {
      messages = await client.getMessages(message.channel.id, {
        limit: +args.shift(),
        before: message.id,
      })
    } catch (e) {
      return 'Could not retrieve messages.'
    }
    // Delete the messages.
    try {
      const reason = args.join(' ') || 'Purge'
      await client.deleteMessages(
        message.channel.id,
        messages.map(i => i.id),
        reason,
      )
    } catch (e) {
      return {
        content: 'Could not delete messages. Are the messages older than 2 weeks?',
        error: true,
      }
    }
  },
}
