import type { Command } from '../../imports/types.ts'
import { getInsult, getUser, parseSilentDelete } from '../../imports/tools.ts'
import { checkRolePosition } from '../../imports/permissions.ts'
import type { Message } from '@projectdysnomia/dysnomia'

export const handleKick: Command = {
  name: 'kick',
  opts: {
    description: 'Kick someone.',
    fullDescription: 'Kick someone.',
    usage: '/kick <user by ID/username/mention> (--silent|-s) (--delete|-d) (reason)',
    guildOnly: true,
    example: '/kick voldemort you is suck',
    requirements: { permissions: { kickMembers: true } },
  },
  generator: async (message, args, { client }) => {
    // Find the user ID.
    const user = getUser(message, args.shift())
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // If the user cannot kick the person..
    if (
      checkRolePosition(message.member.guild.members.get(user.id)) >=
      checkRolePosition(message.member)
    ) {
      return { content: `You cannot kick this person, you ${getInsult()}.`, error: true }
    }
    // Now we kick the person.
    const f = parseSilentDelete(args)
    // If we can't ban the person..
    if (
      message.member.guild.members.get(user.id) &&
      (checkRolePosition(message.member.guild.members.get(user.id)) >=
        checkRolePosition(message.member.guild.members.get(client.user.id)) ||
        !message.member.guild.members.get(client.user.id).permissions.has('banMembers'))
    )
      return { content: `I cannot kick this person, you ${getInsult()}.`, error: true }
    // Notify the user.
    let dm: Message
    if (!f.silent) {
      try {
        dm = await (
          await client.getDMChannel(user.id)
        ).createMessage(
          f.args.length !== 0
            ? `You have been kicked from ${message.member.guild.name} for ${f.args.join(' ')}.`
            : `You have been kicked from ${message.member.guild.name}.`,
        )
      } catch (e) {}
    }
    try {
      await client.kickGuildMember(message.member.guild.id, user.id, args.join(' '))
    } catch (e) {
      if (dm) await dm.delete().catch(() => {})
      return 'I am unable to kick that user.'
    }
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      await client.createMessage(
        '402437089557217290',
        f.args.length !== 0
          ? `**${user.username}#${user.discriminator}** has been kicked for **${f.args.join(' ')}**.`
          : `**${user.username}#${user.discriminator}** has been kicked for not staying chill >:L `,
      )
    }
    if (f.delete) message.delete('Deleted kick command.').catch(() => {}) // Ignore error.
    if (!f.silent) return `**${user.username}#${user.discriminator}** has been kicked. **rip.**`
  },
}
