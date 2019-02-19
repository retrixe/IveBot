// All the types!
import { Message } from 'eris' // eslint-disable-line no-unused-vars
import { Command } from '../imports/types'
// All the needs!
import { getIdFromMention, getInsult, getUser } from '../imports/tools'
import * as ms from 'ms'
import 'json5/lib/require'
import { host, testPilots } from '../../../config.json5'
import * as moment from 'moment'

export const handleServerinfo: Command = {
  name: 'serverinfo',
  aliases: ['serveri', 'guildinfo', 'si'],
  opts: {
    description: 'Displays info on the current servers.',
    fullDescription: 'Displays info on the current servers (or other mutual servers).',
    example: '/serverinfo',
    usage: '/serverinfo (mutual server ID)',
    argsRequired: false
  },

  generator: async (message, args, { client }) => {
    // Check if a guild was specified.
    let guild = args.length ? client.guilds.find(
      i => i.members.find(f => f.id === message.author.id) && i.id === args[0]
    ) : message.member.guild
    if (!guild) return `Specify a valid mutual guild, ${getInsult()}.`
    // Owner.
    const owner = guild.members.find(i => i.id === guild.ownerID)
    // Display information.
    return {
      content: `⌨ **Server info on ${guild.name}:**`,
      embed: {
        author: { name: guild.name, icon_url: guild.iconURL },
        thumbnail: { url: guild.iconURL },
        color: Math.floor(Math.random() * 1000000 - 1),
        footer: { text: `ID: ${guild.id}` },
        timestamp: new Date().toISOString(),
        fields: [
          { name: 'Owner', value: `${owner.username}#${owner.discriminator}`, inline: true },
          { name: 'Owner ID', value: guild.ownerID, inline: true },
          { name: 'Region', value: guild.region, inline: true },
          {
            name: 'Channel Categories',
            inline: true,
            value: guild.channels.filter(i => i.type === 4).length.toString()
          },
          {
            name: 'Text Channels',
            inline: true,
            value: guild.channels.filter(i => i.type === 0).length.toString()
          },
          {
            name: 'Voice Channels',
            inline: true,
            value: guild.channels.filter(i => i.type === 2).length.toString()
          },
          { name: 'Members', inline: true, value: guild.memberCount.toString() },
          {
            name: 'Humans',
            inline: true,
            value: guild.members.filter(i => !i.bot).length.toString()
          },
          {
            name: 'Bots',
            inline: true,
            value: guild.members.filter(i => i.bot).length.toString()
          },
          { name: 'Roles', inline: true, value: guild.roles.size.toString() }
        ]
      }
    }
  }
}

export const handleUserinfo: Command = {
  name: 'userinfo',
  aliases: ['useri', 'uinfo', 'ui'],
  opts: {
    description: 'Displays info on a particular user.',
    fullDescription: 'Displays info on a particular user.',
    example: '/userinfo voldemort#6931',
    usage: '/userinfo (user by ID/mention/username)',
    argsRequired: false
  },
  generator: async (message, args, { client }) => {
    // Find the user ID.
    const toGet = args.length === 0 ? message.author.id : args.shift()
    let user = getUser(message, toGet)
    if (!user && message.author.id === host && [18, 17].includes(toGet.length) && !isNaN(+toGet)) {
      try { user = await client.getRESTUser(toGet) } catch (e) { }
    }
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Display information.
    const member = message.member.guild.members.find(i => i.user.id === user.id)
    const color = member
      ? member.roles.map(i => member.guild.roles.get(i)).sort(
        (a, b) => a.position > b.position ? -1 : 1
      ).shift().color : 0
    return {
      content: `👥 **Userinfo on ${user.username}:**`,
      embed: {
        author: { name: `User info`, icon_url: user.avatarURL },
        title: `${user.username}#${user.discriminator}` + (user.bot ? ' (Bot account)' : ''),
        description: user.mention,
        thumbnail: { url: user.avatarURL },
        color,
        fields: [
          { name: 'Status', value: member ? member.status : 'N/A', inline: true },
          // { name: 'Join Position }
          // { name: 'Name', value: user.username, inline: true },
          // { name: 'Discriminator', value: user.discriminator, inline: true },
          {
            name: 'Joined server at',
            value: member ? moment(member.joinedAt).format('DD/MM/YYYY, hh:mm:ss A') : 'N/A',
            inline: true
          },
          { name: 'User ID', value: user.id, inline: true },
          {
            name: 'Registered at',
            value: moment(user.createdAt).format('DD/MM/YYYY, hh:mm:ss A'),
            inline: true
          },
          {
            name: `Roles (${member ? member.roles.length : 'N/A'})`,
            value: member ? member.roles.map(i => member.guild.roles.get(i)).sort(
              (a, b) => a.position > b.position ? -1 : 1
            ).map(i => `<@&${i.id}>`).join(' ') : 'N/A'
          }
          // { name: 'Permissions' }
        ]
      }
    }
  }
}

export const handleRequest: Command = {
  name: 'request',
  aliases: ['req'],
  opts: {
    description: 'Request a specific feature.',
    fullDescription: 'Request a feature. 24 hour cooldown except for test pilots.',
    usage: '/request <suggestion>',
    example: '/request a /userinfo command.'
  },
  generator: async ({ author }, args, { client, tempDB }) => {
    // Check for cooldown.
    if (!testPilots.includes(author.id) &&
      host !== author.id && tempDB.cooldowns.request.includes(author.id)
    ) return 'This command is cooling down right now. Try again later.'
    client.createMessage((await client.getDMChannel(host)).id,
      `${author.username}#${author.discriminator} with ID ${author.id}: ${args.join(' ')}`
    )
    // Add cooldown.
    if (!testPilots.includes(author.id) && host !== author.id) {
      tempDB.cooldowns.request.push(author.id)
      setTimeout(async () => (tempDB.cooldowns.request.splice(
        tempDB.cooldowns.request.findIndex(i => i === author.id), 1
      )), ms('1 day'))
    }
    // Confirm the request.
    return `${author.mention}, what a pathetic idea. It has been DMed to the main developer \
and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`
  }
}

export const handleSay: Command = {
  name: 'say',
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    description: 'Say something, even in another channel.',
    fullDescription: 'Say something. Test pilots and admins/mods only.',
    usage: '/say (channel) <text>',
    example: '/say #general heyo',
    deleteCommand: true
  },
  postGenerator: (message, args, sent, { tempDB }) => {
    if (sent) tempDB.say[sent.channel.id] = sent.id
  },
  generator: async (message, args, { client, tempDB }) => {
    // Should it be sent in another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (
      message.channelMentions[0] === possibleChannel ||
      (message.member && message.member.guild.channels.has(possibleChannel))
    ) {
      if (message.member && !message.member.guild.channels.get(possibleChannel)
        .permissionsOf(message.member.id).has('sendMessages')
      ) return `**You don't have enough permissions for that, you ${getInsult()}.**`
      args.shift()
      if (args.join(' ') === 'pls adim me') args = ['no']
      tempDB.say[message.channelMentions[0]] = (
        await client.createMessage(message.channelMentions[0], args.join(' '))
      ).id
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
    return args.join(' ')
  }
}

export const handleType: Command = {
  name: 'type',
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    description: 'Type something, even in another channel.',
    fullDescription: 'Type something. Test pilots and admins/mods only.',
    usage: '/type (channel) <text>',
    example: '/type #general heyo',
    deleteCommand: true
  },
  postGenerator: (message, args, sent, { tempDB }) => {
    if (sent) tempDB.say[sent.channel.id] = sent.id
  },
  generator: async (message, args, { tempDB, client }) => {
    // Should it be sent in another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (
      message.channelMentions[0] === possibleChannel ||
      (message.member && message.member.guild.channels.has(possibleChannel))
    ) {
      if (message.member && !message.member.guild.channels.get(possibleChannel)
        .permissionsOf(message.member.id).has('sendMessages')
      ) return `**You don't have enough permissions for that, you ${getInsult()}.**`
      args.shift()
      if (args.join(' ') === 'pls adim me') args = ['no']
      message.channel.sendTyping()
      await (ms => new Promise(resolve => setTimeout(resolve, ms)))(
        args.join(' ').length * 120 > 8000 ? 8000 : args.join(' ').length * 120
      )
      tempDB.say[message.channelMentions[0]] = (
        await client.createMessage(message.channelMentions[0], args.join(' '))
      ).id
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
    message.channel.sendTyping()
    await (ms => new Promise(resolve => setTimeout(resolve, ms)))(
      args.join(' ').length * 120 > 8000 ? 8000 : args.join(' ').length * 120
    )
    return args.join(' ')
  }
}

export const handleRemindme: Command = {
  name: 'remindme',
  aliases: ['rm'],
  opts: {
    fullDescription: 'Remind you of something.',
    description: 'Reminders.',
    usage: '/remindme <time in 1d|1h|1m|1s> (--channel|-c) <description>',
    example: '/remindme 1h do your homework'
  },
  generator: (message, args) => {
    if (args.length < 2 || !ms(args[0])) {
      return 'Correct usage: /remindme <time in 1d|1h|1m|1s> <description>'
    }
    let channel = false
    if (args[1] === '-c' || args[1] === '--channel') channel = true
    setTimeout(async () => {
      channel
        ? message.channel.createMessage(
          `⏰ ${message.author.mention} ${args.slice(2).join(' ')}\nReminder set ${args[0]} ago.`
        )
        : (await message.author.getDMChannel()).createMessage(
          `⏰ ${args.slice(1).join(' ')}\nReminder set ${args[0]} ago.`
        )
    }, ms(args[0]))
    return `You will be reminded in ${args[0]} through a ${channel ? 'mention' : 'DM'}.`
  }
}

export const handleAvatar: Command = {
  name: 'avatar',
  aliases: ['av'],
  opts: {
    fullDescription: 'Get a large-sized link to the avatar of a user.',
    description: 'Avatar of a user.',
    usage: '/avatar <user>',
    example: '/avatar @voldemort#6931',
    argsRequired: false
  },
  generator: (message, args) => {
    let user: Message['author'] = getUser(message, args[0]) || message.author
    if (!user && message.mentions.length !== 0) user = message.mentions[0]
    const member = message.member.guild.members.get(user.id)
    return {
      content: '**Avatar:**',
      embed: {
        author: { name: `${user.username}#${user.discriminator}`, icon_url: user.avatarURL },
        image: { url: user.avatarURL.split('128').join('') + '2048' },
        description: `**[Link](${user.avatarURL})**`,
        color: member.roles.map(i => member.guild.roles.get(i)).sort(
          (a, b) => a.position > b.position ? -1 : 1
        ).shift().color
      }
    }
  }
}

export const handleLeave: Command = {
  opts: {
    description: 'Makes you leave the server.',
    fullDescription: 'This kicks you from the server, essentially making you leave.',
    usage: '/leave',
    example: '/leave',
    errorMessage: 'There was an error processing your request.',
    guildOnly: true,
    argsRequired: false
  },
  name: 'leave',
  generator: (message, args, { tempDB, client }) => {
    if (!tempDB.leave.includes(message.author.id)) {
      client.createMessage(
        message.channel.id,
        'Are you sure you want to leave the server? ' +
        'You will require an invite link to join back. Type /leave to confirm.'
      )
      tempDB.leave.push(message.author.id)
      setTimeout(async () => {
        if (tempDB.leave.findIndex(i => i === message.author.id) === -1) return
        client.createMessage(message.channel.id, 'Your leave request has timed out.')
        tempDB.leave.splice(tempDB.leave.findIndex(i => i === message.author.id), 1)
      }, 30000)
    } else if (tempDB.leave.includes(message.author.id)) {
      tempDB.leave.splice(tempDB.leave.findIndex(i => i === message.author.id), 1)
      try {
        client.kickGuildMember(message.member.guild.id, message.author.id, 'Used /leave.')
      } catch (e) {
        return 'You will have to manually leave the server or transfer ownership before leaving.'
      }
      return `${message.author.username}#${message.author.discriminator} has left the server.`
    }
  }
}

export const handleListserverregions: Command = ({
  name: 'listserverregions',
  aliases: ['lsr'],
  opts: {
    fullDescription: 'List available voice regions.',
    description: 'List available voice regions.',
    usage: '/listserverregions',
    example: '/listserverregions',
    guildOnly: true,
    argsRequired: false
  },
  generator: async (message, args, { client }) => 'Available server regions: `' + (
    await client.getVoiceRegions(message.member.guild.id)
  ).map((value) => value.id).join('`, `') + '`'
})

export const handleChangeserverregion: Command = {
  name: 'changeserverregion',
  aliases: ['csr'],
  opts: {
    fullDescription: 'Changes the voice region of the server.',
    description: 'Changes the voice region of the server.',
    usage: '/changeserverregion <server region>',
    example: '/changeserverregion russia',
    guildOnly: true,
    requirements: {
      permissions: { manageGuild: true }
    },
    invalidUsageMessage: 'Correct usage: /changeserverregion <valid server region, /listserverregion>'
  },
  generator: async (message, args, { client }) => {
    if (!message.member.guild.members.find(a => a.id === client.user.id).permission.has('manageGuild')) {
      return 'I require the Manage Server permission to do that..'
    }
    try {
      const guild = await client.editGuild(message.member.guild.id, {
        region: args.join(' ').toLowerCase()
      })
      const name = (await guild.getVoiceRegions()).find(i => i.id === guild.region).name
      return 'Voice region changed to ' + name + ' \\o/'
    } catch (e) { return 'Invalid server voice region.' }
  }
}

export const handleEdit: Command = {
  name: 'edit',
  opts: {
    requirements: { userIDs: [host] },
    description: 'Edits a single message.',
    fullDescription: 'Edits a single message. Owner only command.',
    usage: '/edit (channel) <message ID> <new text>',
    example: '/edit #general 123456789012345678 hi',
    deleteCommand: true
  },
  generator: async (message, args, { client }) => {
    // Should it be edited in another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (
      message.channelMentions[0] === possibleChannel ||
      (message.member && message.member.guild.channels.has(possibleChannel))
    ) {
      if (message.member && !message.member.guild.channels.get(possibleChannel)
        .permissionsOf(message.member.id).has('sendMessages')
      ) return `**You don't have enough permissions for that, you ${getInsult()}.**`
      const messageID = args.slice(1).shift()
      try {
        client.editMessage(possibleChannel, messageID, args.slice(1).join(' '))
      } catch (e) { return 'Nothing to edit.' }
      return
    }
    // Edit the message.
    const messageID = args.shift()
    try {
      client.editMessage(message.channel.id, messageID, args.join(' '))
    } catch (e) { return 'Nothing to edit.' }
  }
}

export const handleEditLastSay: Command = {
  name: 'editLastSay',
  aliases: ['els'],
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    description: 'Edits the last say in a channel.',
    fullDescription: 'Edits the last say in a channel. Test pilots and admins/mods only.',
    usage: '/editLastSay (channel) <new text>',
    example: '/editLastSay #general hey',
    deleteCommand: true
  },
  generator: async (message, args, { tempDB, client }) => {
    // Is the edit for another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (
      message.channelMentions[0] === possibleChannel ||
      (message.member && message.member.guild.channels.has(possibleChannel))
    ) {
      if (message.member && message.member.guild.channels.get(possibleChannel)
        .permissionsOf(message.member.id).has('sendMessages')
      ) return `**You don't have enough permissions for that, you ${getInsult()}.**`
      // Edit the message.
      try {
        client.editMessage(possibleChannel, tempDB.say[possibleChannel], args.slice(1).join(' '))
      } catch (e) { return 'Nothing to edit.' }
      return
    }
    // Edit the message.
    try {
      client.editMessage(message.channel.id, tempDB.say[message.channel.id], args.join(' '))
    } catch (e) { return 'Nothing to edit.' }
  }
}
