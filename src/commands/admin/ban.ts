import { User } from 'eris'
import { Command } from '../../imports/types'
import { checkRolePosition } from '../../imports/permissions'
import { getInsult, getUser } from '../../imports/tools'

const parseSilentDelete = (args: string[]) => {
  const data = { args, silent: false, delete: false }
  if ([0, 1].includes(data.args.indexOf('--silent')) || [0, 1].includes(data.args.indexOf('-s'))) {
    data.silent = true
    data.args.splice(data.args.indexOf('--silent'), 1)
  }
  if ([0, 1].includes(data.args.indexOf('--delete')) || [0, 1].includes(data.args.indexOf('-d'))) {
    data.delete = true
    data.args.splice(data.args.indexOf('--delete'), 1)
  }
  return data
}

export const handleBan: Command = {
  name: 'ban',
  opts: {
    description: 'Ban someone.',
    fullDescription: 'Ban someone.',
    usage: '/ban <user by ID/username/mention> (--silent|-s) (--delete|-d) (reason)',
    guildOnly: true,
    example: '/ban voldemort you is suck',
    requirements: { permissions: { banMembers: true } }
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
      try { user = await client.getRESTUser(userSpecified) } catch (e) {
        return { content: 'I cannot find that user.', error: true }
      }
    }
    if (!user) return { content: `Specify a valid user, ${getInsult()}.`, error: true }
    // If the user cannot ban the person..
    if (
      message.member.guild.members.get(user.id) &&
      checkRolePosition(message.member.guild.members.get(user.id)) >=
      checkRolePosition(message.member)
    ) return { content: `You cannot ban this person, you ${getInsult()}.`, error: true }
    // Now we ban the person.
    const f = parseSilentDelete(args)
    // If we can't ban the person..
    if (
      message.member.guild.members.get(user.id) &&
      (checkRolePosition(message.member.guild.members.get(user.id)) >=
      checkRolePosition(message.member.guild.members.get(client.user.id)) ||
      !message.member.guild.members.get(client.user.id).permissions.has('banMembers'))
    ) return { content: `I cannot ban this person, you ${getInsult()}.`, error: true }
    try {
      await client.banGuildMember(message.member.guild.id, user.id, 0, args.join(' '))
    } catch (e) {
      return 'That person could not be banned.'
    }
    try {
      if (!f.silent) {
        await (await client.getDMChannel(user.id)).createMessage(
          f.args.length !== 0
            ? `You have been banned from ${message.member.guild.name} for ${f.args.join(' ')}.`
            : `You have been banned from ${message.member.guild.name}.`
        )
      }
    } catch (e) {}
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      await client.createMessage('402437089557217290', f.args.length !== 0
        ? `**${user.username}#${user.discriminator}** has been banned for **${f.args.join(' ')}**.`
        : `**${user.username}#${user.discriminator}** has been banned for not staying chill >:L `
      )
    }
    if (f.delete) message.delete().catch(() => {}) // Ignore error.
    if (!f.silent) return `**${user.username}#${user.discriminator}** has been banned. **rip.**`
  }
}

export const handleUnban: Command = {
  name: 'unban',
  opts: {
    description: 'Unban someone.',
    fullDescription: 'Unban someone.',
    usage: '/unban <user by ID/username/mention> (reason)',
    example: '/unban voldemort wrong person',
    guildOnly: true,
    requirements: { permissions: { banMembers: true } }
  },
  generator: async (message, args, { client }) => {
    // Check bot for permissions.
    if (!message.member.guild.members.get(client.user.id).permissions.has('banMembers')) {
      return `I lack permission to unban members, you ${getInsult()}.`
    }
    // Find the user ID.
    const userSpecified = args.shift()
    let user: User
    if (client.users.find(i => i.username === userSpecified)) {
      user = client.users.find(i => i.username === userSpecified)
    } else if (client.users.get(userSpecified)) {
      user = client.users.get(userSpecified)
    } else {
      try { user = await client.getRESTUser(userSpecified) } catch (e) {}
    }
    if (!user) return { content: 'I cannot find that user.', error: true }
    // Now we unban the person.
    try {
      await client.unbanGuildMember(message.member.guild.id, user.id, args.join(' '))
    } catch (e) { return 'That user could not be unbanned.' }
    return `**${user.username}#${user.discriminator}** has been unbanned.`
  }
}
