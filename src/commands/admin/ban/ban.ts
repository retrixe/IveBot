import type { User } from '@projectdysnomia/dysnomia'
import type { Command } from '../../../imports/types.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'
import { getInsult, getUser, parseSilentDelete } from '../../../imports/tools.ts'

export const handleBan: Command = {
  name: 'ban',
  opts: {
    description: 'Ban someone.',
    fullDescription: 'Ban someone.',
    usage: '/ban <user by ID/username/mention> (--silent|-s) (--delete|-d) (reason)',
    guildOnly: true,
    example: '/ban voldemort you is suck',
    requirements: { permissions: { banMembers: true } },
  },
  aliases: ['banana', 'nuke'],
  generator: async (message, args, { client }) => {
    // Find the user ID.
    const userSpecified = args.shift()
    let user: User = getUser(message, userSpecified)
    if (!user && client.users.find(i => i.username === userSpecified)) {
      user = client.users.find(i => i.username === userSpecified)
    } else if (!user && client.users.get(userSpecified)) {
      user = client.users.get(userSpecified)
    } else if (!user && [18, 17].includes(userSpecified.length) && !isNaN(+userSpecified)) {
      try {
        user = await client.getRESTUser(userSpecified)
      } catch {
        return { content: 'I cannot find that user.', error: true }
      }
    }
    if (!user) return { content: `Specify a valid user, ${getInsult()}.`, error: true }
    // If the user cannot ban the person..
    if (
      message.member.guild.members.get(user.id) &&
      checkRolePosition(message.member.guild.members.get(user.id)) >=
        checkRolePosition(message.member)
    )
      return { content: `You cannot ban this person, you ${getInsult()}.`, error: true }
    // Now we ban the person.
    const f = parseSilentDelete(args)
    // If we can't ban the person..
    if (
      message.member.guild.members.get(user.id) &&
      (checkRolePosition(message.member.guild.members.get(user.id)) >=
        checkRolePosition(message.member.guild.members.get(client.user.id)) ||
        !message.member.guild.members.get(client.user.id).permissions.has('banMembers'))
    )
      return { content: `I cannot ban this person, you ${getInsult()}.`, error: true }
    let dm
    try {
      if (!f.silent) {
        dm = await (
          await client.getDMChannel(user.id)
        ).createMessage(
          f.args.length !== 0
            ? `You have been banned from ${message.member.guild.name} for ${f.args.join(' ')}.`
            : `You have been banned from ${message.member.guild.name}.`,
        )
      }
    } catch {
      /* Ignore error */
    }
    try {
      await client.banGuildMember(message.member.guild.id, user.id, {
        deleteMessageSeconds: 0,
        reason: args.join(' '),
      })
    } catch {
      if (dm)
        await dm.delete().catch(() => {
          /* Ignore error */
        })
      return 'That person could not be banned.'
    }
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      await client.createMessage(
        '402437089557217290',
        f.args.length !== 0
          ? `**${user.username}#${user.discriminator}** has been banned for **${f.args.join(' ')}**.`
          : `**${user.username}#${user.discriminator}** has been banned for not staying chill >:L `,
      )
    }
    if (f.delete)
      message.delete().catch(() => {
        /* Ignore error */
      })
    if (!f.silent) return `**${user.username}#${user.discriminator}** has been banned. **rip.**`
  },
}
