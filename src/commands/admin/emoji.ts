import type { Command } from '../../imports/types.ts'
import { getInsult, getIdFromMention, fetchLimited } from '../../imports/tools.ts'

export const handleAddemoji: Command = {
  name: 'addEmoji',
  aliases: ['ae', 'createemoji'],
  opts: {
    description: 'Add an emoji to the server.',
    fullDescription: 'Add an emoji to the server.',
    usage: '/addemoji <name> <link or attached image>',
    example: '/addemoji whateverURLmeh',
    guildOnly: true,
    requirements: { permissions: { manageEmojisAndStickers: true } },
  },
  generator: async (message, args, { client }) => {
    // Get the URL.
    const url =
      args.length > 1
        ? args.splice(1).join('%20')
        : message.attachments?.find(attachment => !!attachment)?.url
    // This can check the first bits of the Buffer.
    const check = (header: number[], buf: Buffer): boolean => {
      for (let i = 0; i < header.length; i++) {
        if (header[i] !== buf[i]) return false
      }
      return true
    }
    // Fetch the emoji.
    let image: false | Buffer
    try {
      // image = Buffer.from(await (await fetch(url)).arrayBuffer())
      image = await fetchLimited(url, 0.25)
    } catch (e) {
      return { content: `Invalid image URL, you ${getInsult()}`, error: true }
    }
    // If emoji larger than 384 KB (in case)
    if (image === false || image.byteLength / 1024 >= 384) {
      return {
        content: `Your emoji is larger than 256 KB, resize your image!
I recommend using <https://picresize.com/> if the emoji is JPG.
Set step 2 to No Change, set Max Filesize to 255 in step 4 and set to Best quality.
After checking image format as JPG, resize, View Image and use the URL to the image here.`,
        error: true,
      }
    }
    // Check the slots.
    const isGif = check([0x47, 0x49, 0x46], image)
    if (
      (isGif && message.member.guild.emojis.filter(i => i.animated).length === 50) ||
      message.member.guild.emojis.filter(i => !i.animated).length === 50
    ) {
      return 'Looks like all your emoji slots are used up. Use /deleteemoji on one and try again.'
    } else if (
      !message.member.guild.members.get(client.user.id).permissions.has('manageEmojisAndStickers')
    ) {
      return `I don't even have permissions to do that, you ${getInsult()}.`
    }
    // Try adding it, else throw an error.
    try {
      const emoji = await message.member.guild.createEmoji({
        name: args[0],
        image: `data:image;base64,${image.toString('base64')}`,
      })
      let mention = ''
      if (emoji.animated) mention = `<a:${emoji.name}:${emoji.id}>`
      else mention = `<:${emoji.name}:${emoji.id}>`
      return `Emoji successfully added \\o/ (${mention})`
    } catch (e) {
      return {
        content: `Emoji could not be added. Is the emoji larger than 256 kB?
I recommend using <https://picresize.com/> if the emoji is JPG and too large.
Set step 2 to No Change, set Max Filesize to 255 in step 4 and set to Best quality.
After checking image format as JPG, resize, View Image and use the URL to the image here.`,
        error: true,
      }
    }
  },
}

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
    } catch (e) {
      return 'Emoji could not be edited.'
    }
  },
}

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
