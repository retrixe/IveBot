import type { Command } from '../../imports/types.ts'
import { getInsult, getIdFromMention } from '../../imports/tools.ts'

export const handleEmojiimage: Command = {
  name: 'emojiImage',
  aliases: ['ei', 'emojimage'],
  opts: {
    description: 'Get the image of a custom emoji.',
    fullDescription: 'Get the image of a custom emoji.',
    usage: '/emojiImage <custom emoji by ID/mention/name>',
    example: '/emojiImage <:tom:402567029963489281>',
    guildOnly: true,
  },
  generator: (message, args) => {
    // Get emoji ID.
    const found = message.member.guild.emojis.find(i => i.name === args[0] || i.id === args[0])
    const emoji = args[0].startsWith('<') ? getIdFromMention(args[0]) : found ? found.id : undefined
    // If emoji doesn't exist.
    if (!emoji || ![17, 18].includes(emoji.length))
      return { content: `Invalid custom emoji, you ${getInsult()}.`, error: true }
    // Get image extension.
    const ext = args[0].split(':')[0] === '<a' || found?.animated ? 'gif' : 'png'
    // Return emoji.
    return {
      content: '<:tom:402567029963489281> **| Emoji image:**',
      embeds: [
        {
          color: 0x696969,
          author: { name: found ? found.name : args[0].split(':')[1] },
          description: `**[Link](https://cdn.discordapp.com/emojis/${emoji}.${ext})**`,
          image: { url: `https://cdn.discordapp.com/emojis/${emoji}.${ext}` },
        },
      ],
    }
  },
}
