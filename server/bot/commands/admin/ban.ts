import { User } from 'eris'
import { IveBotCommand, FalseUser } from '../../imports/types'
import { checkRolePosition } from '../../imports/permissions'
import { getInsult, getUser } from '../../imports/tools'

export const handleBan: IveBotCommand = (client) => ({
  name: 'ban',
  opts: {
    description: 'Ban someone.',
    fullDescription: 'Ban someone.',
    usage: '/ban <user by ID/username/mention> (reason)',
    aliases: ['banana', 'nuke'],
    guildOnly: true,
    requirements: { permissions: { 'banMembers': true } }
  },
  generator: async (message, args) => {
    // Find the user ID.
    const userSpecified = args.shift()
    let user: FalseUser|User = getUser(message, userSpecified)
    if (!user && client.users.find(i => i.username === userSpecified)) {
      user = client.users.find(i => i.username === userSpecified)
    } else if (!user && client.users.find(i => i.id === userSpecified)) {
      user = client.users.find(i => i.id === userSpecified)
    } else if (!user && userSpecified.length === 18 && !isNaN(+userSpecified)) {
      user = { id: userSpecified, username: 'Unknown', discriminator: 'user' }
    } else return 'I cannot find that user.'
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // If the user cannot ban the person..
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user)) >=
      checkRolePosition(message.member)
    ) {
      return `You cannot ban this person, you ${getInsult()}.`
    }
    // Now we ban the person.
    try {
      await client.banGuildMember(message.member.guild.id, user.id, 0, args.join(' '))
    } catch (e) { return 'That person could not be banned.' }
    client.createMessage((await client.getDMChannel(user.id)).id, args.length !== 0
      ? `You have been banned from ${message.member.guild.name} for ${args.join(' ')}.`
      : `You have been banned from ${message.member.guild.name}.`
    )
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      client.createMessage('402437089557217290', args.length !== 0
        ? `**${user.username}#${user.discriminator}** has been banned for **${args.join(' ')}**.`
        : `**${user.username}#${user.discriminator}** has been banned for not staying chill >:L `
      )
    }
    return `**${user.username}#${user.discriminator}** has been banned. **rip.**`
  }
})

export const handleUnban: IveBotCommand = (client) => ({
  name: 'unban',
  opts: {
    description: 'Unban someone.',
    fullDescription: 'Unban someone.',
    usage: '/unban <user by ID/username> (reason)',
    guildOnly: true,
    requirements: { permissions: { 'banMembers': true } }
  },
  generator: async (message, args) => {
    // Find the user ID.
    const userSpecified = args.shift()
    let user: User
    if (client.users.find(i => i.username === userSpecified)) {
      user = client.users.find(i => i.username === userSpecified)
    } else if (client.users.find(i => i.id === userSpecified)) {
      user = client.users.find(i => i.id === userSpecified)
    } else return 'I cannot find that user.'
    // Now we unban the person.
    try {
      await client.unbanGuildMember(message.member.guild.id, user.id, args.join(' '))
    } catch (e) { return 'That user could not be unbanned.' }
    return `**${user.username}#${user.discriminator}** has been unbanned.`
  }
})
