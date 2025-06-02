import type { Command } from '../../imports/types.ts'
import { getChannel, getInsult } from '../../imports/tools.ts'

export const handleDeletechannel: Command = {
  name: 'deleteChannel',
  aliases: ['dc', 'removechannel'],
  opts: {
    description: 'Remove a channel from the server.',
    fullDescription: 'Remove a channel from the server.',
    usage: '/deletechannel <channel by ID/mention/name> (reason)',
    example: '/deletechannel ok Accidentally made.',
    guildOnly: true,
    requirements: { permissions: { manageChannels: true } },
  },
  generator: async (message, args, { client }) => {
    // Get the channel ID.
    const channel = getChannel(message, args.shift())
    if (!channel) return { content: `Specify a valid channel, you ${getInsult()}!`, error: true }
    // If no permission to manage channels, say it.
    if (!message.member.guild.members.get(client.user.id).permissions.has('manageChannels')) {
      return { content: "I can't even delete that channel, you " + getInsult() + '.', error: true }
    }
    // Delete it.
    try {
      await channel.delete(args.join(' '))
    } catch (e) {
      return 'I was unable to delete that channel >_<'
    }
    // Confirm the delete.
    return `Channel \`${channel.name}\` deleted.`
  },
}

export const handleEditchannel: Command = {
  name: 'editChannel',
  aliases: ['ec'],
  opts: {
    description: "Edit a channel's settings.",
    fullDescription: "Edit a channel's settings with ease.",
    usage:
      '/editchannel <channel by ID/mention/name> (name-<channel name>) ' +
      '(topic-<channel topic>) (nsfw-<true/false>) (bitrate-<8 to 96 kbps>) ' +
      '(userLimit-<0 to 99>) (rateLimitPerUser-<0 to 120>)',
    example: '/ec general topic-All topics allowed here.',
    guildOnly: true,
    requirements: { permissions: { manageChannels: true } },
  },
  generator: async (message, args, { client }) => {
    // Get the channel ID.
    const channel = getChannel(message, args.shift())
    if (!channel) return { content: `Specify a valid channel, you ${getInsult()}!`, error: true }
    // If no permission to manage channel, say it.
    if (!channel.permissionsOf(client.user.id).has('manageChannels')) {
      return { content: "I can't edit that channel, you " + getInsult() + '.', error: true }
    }
    // Get the operations.
    const ops: string[] = args.join(' ').split('|')
    // Now iterate over each operation and execute them.
    const operationTypes = ['name', 'topic', 'rateLimitPerUser', 'nsfw', 'bitrate', 'userLimit']
    const failedOps: Array<{ name: string; value: string }> = []
    for (const operation of ops) {
      const opArr = operation.split('-')
      const name = opArr.shift()
      const value = opArr.join('-')
      // Validate each operation.
      if (!operationTypes.includes(name)) { // Is it a valid operation?
        failedOps.push({ name: `❌ ${operation}`, value: 'Invalid operation.' })
      } else if ( // Text channel only properties for voice channels?
        ['rateLimitPerUser', 'nsfw', 'topic'].includes(name) && channel.type === 2
      ) failedOps.push({ name: `❌ ${operation}`, value: 'This operation is text channel only.' })
      else if (
        ['bitrate', 'userLimit'].includes(name) && channel.type === 0
      ) failedOps.push({ name: `❌ ${operation}`, value: 'This operation is voice channel only.' })
      // Check for types.
      else if (name === 'rateLimitPerUser' && (isNaN(+value) || +value > 120 || +value < 0)) {
        failedOps.push({
          name: `❌ ${operation}`, value: 'rateLimitPerUser must be a number between 0 and 120.'
        })
      } else if (name === 'nsfw' && value !== 'true' && value !== 'false') {
        failedOps.push({ name: `❌ ${operation}`, value: 'NSFW must be either true or false.' })
      } else if (name === 'bitrate' && (isNaN(+value) || +value < 8 || +value > 384)) {
        failedOps.push({ name: `❌ ${operation}`, value: 'bitrate must be a number between 8-384.' })
      } else if (name === 'userLimit' && (isNaN(+value) || +value > 99 || +value < 0)) {
        failedOps.push({ name: `❌ ${operation}`, value: 'userLimit must be a number between 0-99.' })
        // Now we edit the channel.
      } else {
        try {
          if (name === 'name') await channel.edit({ name: value })
          else if (name === 'topic') await channel.edit({ topic: value })
          else if (name === 'rateLimitPerUser') await channel.edit({ rateLimitPerUser: +value })
          else if (name === 'nsfw') await channel.edit({ nsfw: value === 'true' })
          else if (name === 'bitrate') await channel.edit({ bitrate: +value * 1000 })
          else if (name === 'userLimit') await channel.edit({ userLimit: +value })
        } catch (e) {
          failedOps.push({ name: `❌ ${operation}`, value: e.toString() })
        }
      }
    }
    if (failedOps.length > 0) {
      return {
        content: 'Some operations failed to execute..',
        embeds: [{ color: 0x696969, fields: failedOps }],
      }
    }
    return '✅ All operations executed successfully \\o/'
  },
}
