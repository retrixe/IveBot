import { IveBotCommand } from '../imports/types'
import { getInsult, getUser } from '../imports/tools'
import { checkRolePosition } from '../imports/permissions'
export { handleWarn } from './admin/warn'
export { handleBan } from './admin/ban'

export const handlePurge: IveBotCommand = (client) => ({
  name: 'purge',
  opts: {
    description: 'Bulk delete a set of messages.',
    fullDescription: 'Bulk delete messages newer than 2 weeks.',
    usage: '/purge <number greater than 0>',
    guildOnly: true,
    requirements: { permissions: { 'manageMessages': true } },
    permissionMessage: `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
  },
  generator: (message, args) => {
    // Check if usage is correct.
    if (
      isNaN(+args[0]) || args.length !== 1 || +args[0] === 0
    ) { return 'Correct usage: /purge <number greater than 0>' }
    // Get the list of messages.
    client.getMessages(message.channel.id, +args[0], message.id).then((res) => {
      res.push(message)
      client.deleteMessages(message.channel.id, res.map(i => i.id), 'Purge').catch(() => {
        client.createMessage(
          message.channel.id, 'Could not delete messages. Are the messages older than 2 weeks?'
        )
      })
    }).catch(() => client.createMessage(message.channel.id, 'Could not retrieve messages.'))
  }
})

export const handleKick: IveBotCommand = (client) => ({
  name: 'kick',
  opts: {
    description: 'Kick someone.',
    fullDescription: 'Kick someone.',
    usage: '/kick <user by ID/username/mention> (reason)',
    guildOnly: true,
    requirements: { permissions: { 'kickMembers': true } },
    permissionMessage: `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
  },
  generator: (message, args) => {
    // Find the user ID.
    let user = getUser(message, args.shift())
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // If the user cannot kick the person..
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user)) >=
      checkRolePosition(message.member)
    ) {
      return `You cannot kick this person, you ${getInsult()}.`
    }
    // Now we kick the person.
    client.kickGuildMember(message.member.guild.id, user.id, args.join(' ')).then(() => {
      client.createMessage(
        message.channel.id, `**${user.username}#${user.discriminator}** has been kicked. **rip.**`
      )
      client.getDMChannel(user.id).then((c) => client.createMessage(c.id, args.length !== 0
        ? `You have been kicked from ${message.member.guild.name} for ${args.join(' ')}.`
        : `You have been kicked from ${message.member.guild.name}.`
      ))
      // WeChill
      if (message.member.guild.id === '402423671551164416') {
        client.createMessage('402437089557217290', args.length !== 0
          ? `**${user.username}#${user.discriminator}** has been kicked for **${args.join(' ')}**.`
          : `**${user.username}#${user.discriminator}** has been kicked for not staying chill >:L `
        )
      }
    })
  }
})
