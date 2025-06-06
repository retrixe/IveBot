import moment from 'moment'
import type { Command } from '../../../imports/types.ts'
import { getUser, getInsult } from '../../../imports/tools.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'

export const handleWarn: Command = {
  name: 'warn',
  opts: {
    description: 'Warn someone.',
    fullDescription: 'Warn someone.',
    usage: '/warn <user by ID/username/mention> <reason>',
    example: '/warn voldemort you is suck',
    guildOnly: true,
    requirements: { permissions: { manageMessages: true } },
  },
  generator: async (message, args, { client, db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length < 2) return { content: 'Correct usage: /warn <user> <reason>', error: true }
    // Now find the user ID.
    const user = getUser(message, args[0])
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.get(user.id)) >=
      checkRolePosition(message.member)
    ) {
      return { content: `You cannot warn this person, you ${getInsult()}.`, error: true }
    }
    // Warn the person internally.
    args.shift()
    await db.collection('warnings').insertOne({
      warnedId: user.id,
      warnerId: message.author.id,
      reason: args.join(' '),
      serverId: message.member.guild.id,
      date: new Date().toUTCString(),
    })
    client
      .createMessage(
        (await client.getDMChannel(user.id)).id,
        `You have been warned in ${message.member.guild.name} for: ${args.join(' ')}.`,
      )
      .catch(() => {
        /* Ignore error */
      })
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      client
        .createMessage('402435742925848578', {
          content: `**${user.username}#${user.discriminator}** has been warned:`,
          embeds: [
            {
              color: 0x00ae86,
              // type: 'rich',
              title: 'Information',
              description: `
  *| Moderator:** ${message.author.username}#${message.author.discriminator} **| Reason:** ${args.join(' ')}
  *| Date:** ${moment(new Date().toUTCString()).format('dddd, MMMM Do YYYY, h:mm:ss A')}`,
            },
          ],
        })
        .catch(() => {
          /* Ignore error */
        })
    }
    return `**${user.username}#${user.discriminator}** has been warned. **lol.**`
  },
}
