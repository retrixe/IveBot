import { Command } from '../../imports/types'
import { getInsult, getUser } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'
import { Message } from 'eris'
export { handleAddemoji, handleDeleteemoji, handleEditemoji, handleEmojiimage } from './emoji'
export { handleWarn, handleWarnings, handleClearwarns, handleRemovewarn } from './warn'
export { handleDeletechannel, handleEditchannel } from './channels'
export { handleGiverole, handleTakerole } from './roles'
export { handleMute, handleUnmute } from './mute'
export { handleBan, handleUnban } from './ban'

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

export const handlePurge: Command = {
  name: 'purge',
  opts: {
    description: 'Bulk delete a set of messages.',
    fullDescription: 'Bulk delete messages newer than 2 weeks.',
    usage: '/purge <number greater than 0 and less than 100>',
    example: '/purge 10',
    guildOnly: true,
    deleteCommand: true,
    requirements: {
      permissions: { 'manageMessages': true },
      custom: (message) => (
        message.member.guild.channels.find(i => i.id === message.channel.id)
          .permissionsOf(message.author.id).has('manageMessages')
      )
    }
  },
  generator: async (message, args, { client }) => {
    // Check if usage is correct.
    if (
      isNaN(+args[0]) || args.length !== 1 || +args[0] <= 0 || +args[0] > 100
    ) { return 'Correct usage: /purge <number greater than 0 and less than 100>' }
    // Pre-defined variables.
    let messages: Array<Message>
    // Get the list of messages.
    try {
      messages = await client.getMessages(message.channel.id, +args.shift(), message.id)
    } catch (e) { return 'Could not retrieve messages.' }
    // Delete the messages.
    try {
      client.deleteMessages(message.channel.id, messages.map(i => i.id), args.join(' ') || 'Purge')
    } catch (e) { return 'Could not delete messages. Are the messages older than 2 weeks?' }
  }
}

export const handleKick: Command = {
  name: 'kick',
  opts: {
    description: 'Kick someone.',
    fullDescription: 'Kick someone.',
    usage: '/kick <user by ID/username/mention> (--silent|-s) (--delete|-d) (reason)',
    guildOnly: true,
    example: '/kick voldemort you is suck',
    requirements: { permissions: { 'kickMembers': true } }
  },
  generator: async (message, args, { client }) => {
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
    const f = parseSilentDelete(args)
    try {
      await client.kickGuildMember(message.member.guild.id, user.id, args.join(' '))
    } catch (e) { return 'I am unable to kick that user.' }
    if (!f.silent) {
      client.createMessage((await client.getDMChannel(user.id)).id, f.args.length !== 0
        ? `You have been kicked from ${message.member.guild.name} for ${f.args.join(' ')}.`
      : `You have been kicked from ${message.member.guild.name}.`
    )
    }
    // WeChill
    if (message.member.guild.id === '402423671551164416') {
      client.createMessage('402437089557217290', f.args.length !== 0
        ? `**${user.username}#${user.discriminator}** has been kicked for **${f.args.join(' ')}**.`
        : `**${user.username}#${user.discriminator}** has been kicked for not staying chill >:L `
      )
    }
    if (f.delete) message.delete('Deleted kick command.')
    if (!f.silent) return `**${user.username}#${user.discriminator}** has been kicked. **rip.**`
  }
}

export const handleSlowmode: Command = {
  name: 'slowmode',
  aliases: ['sm'],
  opts: {
    description: 'When you must slow down chat.',
    fullDescription: 'When you must slow down chat.',
    usage: '/slowmode <number in seconds, max: 120 or off>',
    guildOnly: true,
    example: '/slowmode off',
    requirements: {
      permissions: { 'manageChannels': true },
      custom: (message) => (
        message.member.guild.channels.find(i => i.id === message.channel.id)
          .permissionsOf(message.author.id).has('manageChannels')
      )
    }
  },
  generator: async (message, args, { client }) => {
    // Check user for permissions.
    const t = +args[0]
    if (
      (isNaN(t) && args[0] !== 'off') || !args[0] || t < 0 || t > 120 || args.length > 1
    ) { return 'Correct usage: /slowmode <number in seconds, max: 120 or off>' }
    // Set slowmode.
    try {
      client.editChannel(message.channel.id, { rateLimitPerUser: isNaN(t) ? 0 : t })
    } catch (e) { return 'I cannot use slowmode >_<' }
    return `Successfully set slowmode to ${isNaN(t) || t === 0 ? 'off' : `${t} seconds`} 👌`
  }
}
