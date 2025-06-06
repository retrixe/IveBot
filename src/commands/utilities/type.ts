// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getIdFromMention, getInsult } from '../../imports/tools.ts'
import { host, testPilots } from '../../config.ts'

export const handleType: Command = {
  name: 'type',
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    description: 'Type something, even in another channel.',
    fullDescription: 'Type something. Test pilots and admins/mods only.',
    usage: '/type (channel) <text>',
    example: '/type #general heyo',
    deleteCommand: true,
  },
  postGenerator: (message, args, sent, { tempDB }) => {
    if (sent) tempDB.say.set(sent.channel.id, sent.id)
  },
  generator: async (message, args, { tempDB, client }) => {
    // Should it be sent in another channel?
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
      args.shift()
      if (args.join(' ') === 'pls adim me') args = ['no']
      await client.sendChannelTyping(message.channelMentions[0])
      await (async ms => await new Promise(resolve => setTimeout(resolve, ms)))(
        args.join(' ').length * 120 > 8000 ? 8000 : args.join(' ').length * 120,
      )
      const sent = await client.createMessage(message.channelMentions[0], {
        content: args.join(' '),
        allowedMentions: {
          everyone: message.member?.permissions.has('mentionEveryone'),
          users: true,
          roles:
            message.member &&
            (message.member.permissions.has('mentionEveryone') ||
              message.member.guild.roles.filter(e => e.mentionable).map(e => e.id)),
        },
      })
      tempDB.say.set(message.channelMentions[0], sent.id)
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
    await message.channel.sendTyping()
    await (async ms => await new Promise(resolve => setTimeout(resolve, ms)))(
      args.join(' ').length * 120 > 8000 ? 8000 : args.join(' ').length * 120,
    )
    return {
      content: args.join(' '),
      allowedMentions: {
        everyone: message.member?.permissions.has('mentionEveryone'),
        users: true,
        roles:
          message.member &&
          (message.member.permissions.has('mentionEveryone') ||
            message.member.guild.roles.filter(e => e.mentionable).map(e => e.id)),
      },
    }
  },
}
