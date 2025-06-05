import type { Command } from '../../../imports/types.ts'
import { getInsult, getIdFromMention } from '../../../imports/tools.ts'

export const handleEditemoji: Command = {
  name: 'editEmoji',
  aliases: ['ee', 'renameEmoji', 're'],
  opts: {
    description: 'Edit an emoji name in the server.',
    fullDescription: 'Edit an emoji name in the server.',
    usage: '/editEmoji <custom emoji by ID/mention/name> <new name>',
    example: '/editEmoji tim tim2',
    guildOnly: true,
    requirements: { permissions: { manageEmojisAndStickers: true } },
  },
  generator: async (message, args, { client }) => {
    // Check if enough arguments were provided.
    if (args.length !== 2) return 'Correct usage: /editEmoji <emoji by ID/mention/name> <new name>'
    // Check bot permissions.
    if (
      !message.member.guild.members.get(client.user.id).permissions.has('manageEmojisAndStickers')
    )
      return {
        content: `I don't even have permissions to do that, you ${getInsult()}.`,
        error: true,
      }
    // Try editing it, else throw an error.
    try {
      const emoji = message.member.guild.emojis.find(
        i => i.name === args[0] || i.id === args[0] || i.id === getIdFromMention(args[0]),
      )
      // If emoji doesn't exist.
      if (!emoji) return { content: `Invalid emoji, you ${getInsult()}.`, error: true }
      const newEmoji = await message.member.guild.editEmoji(emoji.id, { name: args[1] })
      let mention = ''
      if (newEmoji.animated) mention = `<a:${newEmoji.name}:${newEmoji.id}>`
      else mention = `<:${newEmoji.name}:${newEmoji.id}>`
      return `Emoji successfully edited \\o/ ${mention}`
    } catch {
      return 'Emoji could not be edited.'
    }
  },
}
