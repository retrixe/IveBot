import type { Command } from '../../../imports/types.ts'
import { getInsult, getIdFromMention, fetchLimited } from '../../../imports/tools.ts'

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
