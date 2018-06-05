import { IveBotCommand } from '../imports/types'
import { getInsult, getUser } from '../imports/tools'
import { checkRolePosition } from '../imports/permissions'
import { Message } from 'eris'
export { handleWarn } from './admin/warn'
export { handleMute, handleUnmute } from './admin/mute'
export { handleBan, handleUnban } from './admin/ban'

export const handlePurge: IveBotCommand = (client) => ({
  name: 'purge',
  opts: {
    description: 'Bulk delete a set of messages.',
    fullDescription: 'Bulk delete messages newer than 2 weeks.',
    usage: '/purge <number greater than 0>',
    guildOnly: true,
    deleteCommand: true,
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args) => {
    // Check if usage is correct.
    if (
      isNaN(+args[0]) || args.length !== 1 || +args[0] === 0
    ) { return 'Correct usage: /purge <number greater than 0>' }
    // Pre-defined variables.
    let messages: Array<Message>
    // Get the list of messages.
    try {
      messages = await client.getMessages(message.channel.id, +args[0], message.id)
    } catch (e) { return 'Could not retrieve messages.' }
    // Delete the messages.
    try {
      client.deleteMessages(message.channel.id, messages.map(i => i.id), 'Purge')
    } catch (e) { return 'Could not delete messages. Are the messages older than 2 weeks?' }
  }
})

export const handleKick: IveBotCommand = (client) => ({
  name: 'kick',
  opts: {
    description: 'Kick someone.',
    fullDescription: 'Kick someone.',
    usage: '/kick <user by ID/username/mention> (reason)',
    guildOnly: true,
    requirements: { permissions: { 'kickMembers': true } }
  },
  generator: async (message, args) => {
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
    try {
      await client.kickGuildMember(message.member.guild.id, user.id, args.join(' '))
    } catch (e) { return 'I am unable to kick that user.' }
    client.createMessage((await client.getDMChannel(user.id)).id, args.length !== 0
      ? `You have been kicked from ${message.member.guild.name} for ${args.join(' ')}.`
      : `You have been kicked from ${message.member.guild.name}.`
    )
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      client.createMessage('402437089557217290', args.length !== 0
        ? `**${user.username}#${user.discriminator}** has been kicked for **${args.join(' ')}**.`
        : `**${user.username}#${user.discriminator}** has been kicked for not staying chill >:L `
      )
    }
    return `**${user.username}#${user.discriminator}** has been kicked. **rip.**`
  }
})
