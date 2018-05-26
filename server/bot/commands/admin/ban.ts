import { IveBotCommand } from '../../imports/types'
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
    requirements: { permissions: { 'banMembers': true } },
    permissionMessage: `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
  },
  generator: (message, args) => {
    // Find the user ID.
    let user = getUser(message, args.shift())
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // If the user cannot ban the person..
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user)) >=
      checkRolePosition(message.member)
    ) {
      return `You cannot ban this person, you ${getInsult()}.`
    }
    // Now we ban the person.
    client.banGuildMember(message.member.guild.id, user.id, 0, args.join(' ')).then(() => {
      client.createMessage(
        message.channel.id, `**${user.username}#${user.discriminator}** has been banned. **rip.**`
      )
      client.getDMChannel(user.id).then((c) => client.createMessage(c.id, args.length !== 0
        ? `You have been banned from ${message.member.guild.name} for ${args.join(' ')}.`
        : `You have been banned from ${message.member.guild.name}.`
      ))
      // WeChill
      if (message.member.guild.id === '402423671551164416') {
        client.createMessage('402437089557217290', args.length !== 0
          ? `**${user.username}#${user.discriminator}** has been banned for **${args.join(' ')}**.`
          : `**${user.username}#${user.discriminator}** has been banned for not staying chill >:L `
        )
      }
    })
  }
})
