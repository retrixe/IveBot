// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getIdFromMention, getInsult } from '../../imports/tools.ts'
import { host, testPilots } from '../../config.ts'

export const handleSay: Command = {
  name: 'say',
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    description: 'Say something, even in another channel.',
    fullDescription: 'Say something. Test pilots and admins/mods only.',
    usage: '/say (channel) <text>',
    example: '/say #general heyo',
    deleteCommand: true,
  },
  postGenerator: (message, args, sent, { tempDB }) => {
    if (sent) tempDB.say[sent.channel.id] = sent.id
  },
  generator: async (message, args, { client, tempDB }) => {
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
      tempDB.say[message.channelMentions[0]] = (
        await client.createMessage(message.channelMentions[0], {
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
      ).id
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
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
