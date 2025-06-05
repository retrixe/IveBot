import type { Command } from '../../../imports/types.ts'
import { getInsult, getIdFromMention } from '../../../imports/tools.ts'

export const handleDeleteemoji: Command = {
  name: 'deleteEmoji',
  aliases: ['de', 'removeemoji'],
  opts: {
    description: 'Remove an emoji from the server.',
    fullDescription: 'Remove an emoji from the server.',
    usage: '/deleteEmoji <custom emoji by ID/mention/name>',
    example: '/deleteEmoji <:tom:402567029963489281>',
    guildOnly: true,
    requirements: { permissions: { manageEmojisAndStickers: true } },
  },
  generator: async (message, args, { client }) => {
    // Check bot permissions.
    if (
      !message.member.guild.members.get(client.user.id).permissions.has('manageEmojisAndStickers')
    )
      return {
        content: `I don't even have permissions to do that, you ${getInsult()}.`,
        error: true,
      }
    // Try deleting it, else throw an error.
    try {
      const emoji = message.member.guild.emojis.find(
        i => i.name === args[0] || i.id === args[0] || i.id === getIdFromMention(args[0]),
      )
      // If emoji doesn't exist.
      if (!emoji) return { content: `Invalid emoji, you ${getInsult()}.`, error: true }
      await message.member.guild.deleteEmoji(emoji.id)
      return 'Emoji successfully deleted \\o/'
    } catch (e) {
      return 'Emoji could not be deleted.'
    }
  },
}
