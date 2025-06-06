// All the types!
import { Constants } from '@projectdysnomia/dysnomia'
import type { GuildTextableChannel } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getIdFromMention, getInsult } from '../../imports/tools.ts'

export const handleSuppressEmbed: Command = {
  name: 'suppressEmbed',
  aliases: ['suppressEmbeds', 'suppress'],
  opts: {
    requirements: {
      permissions: { manageMessages: true },
      custom: message =>
        (message.channel as GuildTextableChannel)
          .permissionsOf(message.author.id)
          .has('manageMessages'),
    },
    description: 'Suppress or unsuppress embeds in a message.',
    fullDescription: 'Suppress or unsuppress embeds in a message.',
    usage: '/suppress (channel) <message ID/link/reply to a message>',
    example: '/suppress #general 123456789012345678',
    argsRequired: false,
  },
  generator: async (message, args, { client }) => {
    let msg
    console.log(args)
    console.log(message.messageReference)
    if (args.length === 0 && message.messageReference) {
      const { channelID, messageID } = message.messageReference
      msg = message.referencedMessage || (await client.getMessage(channelID, messageID))
    } else if (args.length === 1) {
      const regex =
        /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
      if (regex.test(args[0])) {
        const split = args[0].split('/')
        const channel = message.member.guild.channels.get(split[5]) as GuildTextableChannel
        if (!channel || channel.type !== 0)
          return { content: `That's not a real channel, you ${getInsult()}.`, error: true }
        msg = channel.messages.get(split[6]) || (await channel.getMessage(split[6]))
      } else {
        msg = message.channel.messages.get(args[0]) || (await message.channel.getMessage(args[0]))
      }
    } else if (args.length === 2) {
      const channel = message.member.guild.channels.get(
        getIdFromMention(args[0]),
      ) as GuildTextableChannel
      if (channel && channel.type === 0) {
        msg = channel.messages.get(args[1]) || (await channel.getMessage(args[1]))
      } else return { content: `That's not a real channel, you ${getInsult()}.`, error: true }
    } else
      return {
        content: 'Correct usage: /suppress (channel) <message ID/link/reply to a message>',
        error: true,
      }

    if (msg) {
      await msg.edit({ flags: msg.flags ^ Constants.MessageFlags.SUPPRESS_EMBEDS })
      message.addReaction('✅').catch(() => {
        /* Ignore error */
      })
    } else return { content: `That's not a real message, you ${getInsult()}.`, error: true }
  },
}
