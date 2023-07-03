// All the types!
import Dysnomia, {
  Message,
  GuildTextableChannel,
  Constants,
  Guild,
  InteractionDataOptionsString
} from '@projectdysnomia/dysnomia'
import { Command } from '../imports/types.js'
// All the needs!
import { getIdFromMention, getInsult, getUser, getChannel } from '../imports/tools.js'
import ms from 'ms'
import { host, testPilots } from '../config.js'
import moment from 'moment'
import { evaluate } from 'mathjs'

export const handleServerinfo: Command = {
  name: 'serverinfo',
  aliases: ['serveri', 'guildinfo', 'si'],
  opts: {
    description: 'Displays info on the current servers.',
    fullDescription: 'Displays info on the current servers (or other mutual servers).',
    example: '/serverinfo',
    usage: '/serverinfo (mutual server ID)',
    argsRequired: false,
    options: [{
      name: 'server',
      required: false,
      description: 'A server you share with IveBot.',
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },

  slashGenerator: (interaction, { client }) => {
    const serverOpt = (interaction.data.options[0] as InteractionDataOptionsString)?.value
    let guild = client.guilds.get(serverOpt || interaction.guildID)
    if (serverOpt && guild && !guild.members.has(interaction.user.id)) guild = undefined
    return handleServerinfo.commonGenerator(guild)
  },
  generator: (message, args, { client }) => {
    let guild = args.length > 0 ? client.guilds.get(args[0]) : message.member.guild
    if (args.length > 0 && guild && !guild.members.has(message.author.id)) guild = undefined
    return handleServerinfo.commonGenerator(guild)
  },
  commonGenerator: (guild: Guild) => {
    if (!guild) return { content: `Specify a valid mutual guild, ${getInsult()}.`, error: true }
    // Owner.
    const owner = guild.members.get(guild.ownerID)
    // Nitro Boosting support.
    const boost = guild.premiumSubscriptionCount
      ? [{
          name: '<:boost:602100826214760452> Boost Status',
          value: `Level ${guild.premiumTier || 0} with ${guild.premiumSubscriptionCount} Boosts`,
          inline: true
        }]
      : []
    // Display information.
    return {
      content: `⌨ **Server info on ${guild.name}:**`,
      embeds: [{
        author: { name: guild.name, icon_url: guild.iconURL },
        thumbnail: { url: guild.iconURL },
        color: Math.floor(Math.random() * 1000000 - 1),
        footer: { text: `ID: ${guild.id}` },
        timestamp: new Date().toISOString(),
        fields: [
          ...boost,
          { name: 'Owner', value: `${owner.username}#${owner.discriminator}`, inline: true },
          { name: 'Owner ID', value: guild.ownerID, inline: true },
          // { name: 'Region', value: guild.region, inline: true },
          {
            name: 'Created On',
            value: moment(guild.createdAt).format('DD/MM/YYYY, hh:mm:ss A'),
            inline: true
          },
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
      }]
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
    if (!user) return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Display information.
    const member = message.member.guild.members.get(user.id)
    // TODO: Add publicFlags, game, premiumSince, custom-status. Support per-server pfp, about me, banner.
    const color = member
      ? (member.roles.map(i => member.guild.roles.get(i)).sort(
          (a, b) => a.position > b.position ? -1 : 1
        ).find(i => i.color !== 0) || { color: 0 }).color
      : 0
    return {
      content: `👥 **Userinfo on ${user.username}:**`,
      embeds: [{
        author: { name: 'User info', icon_url: user.avatarURL },
        title: `${user.username}#${user.discriminator}` + (user.bot ? ' (Bot account)' : ''),
        description: user.mention + (member && member.pending ? ' (pending guild screening)' : ''),
        thumbnail: { url: user.dynamicAvatarURL('png', 2048) },
        color,
        fields: [
          { name: 'Status', value: member && member.status ? member.status : 'N/A', inline: true },
          // { name: 'Join Position }
          {
            name: 'Joined server at',
            value: member ? moment(member.joinedAt).format('DD/MM/YYYY, hh:mm:ss A') : 'N/A',
            inline: true
          },
          {
            name: 'Registered at',
            value: moment(user.createdAt).format('DD/MM/YYYY, hh:mm:ss A'),
            inline: true
          },
          // Game...
          // Badges...
          // Boosting since..
          {
            name: `Roles (${member ? member.roles.length : 'N/A'})`,
            value: member
              ? member.roles.map(i => member.guild.roles.get(i)).sort(
                (a, b) => a.position > b.position ? -1 : 1
              ).map(i => `<@&${i.id}>`).join(' ')
              : 'N/A'
          },
          { name: 'Permissions', value: member ? 'Run `/perms <user>` to get their permissions!' : 'N/A' }
        ],
        footer: { text: 'User ID: ' + user.id }
      }]
    }
  }
}

export const handlePermissions: Command = {
  name: 'permissions',
  aliases: ['perms'],
  opts: {
    description: 'Displays a particular member\'s permissions.',
    fullDescription: 'Displays a particular member\'s permissions.',
    example: '/permissions voldemort#6931',
    usage: '/permissions (--ignore-admin) (user by ID/mention/username)',
    argsRequired: false,
    guildOnly: true,
    requirements: { permissions: { manageRoles: true } }
  },
  generator: async (message, args, { client }) => {
    const ignoreAdmin = args.includes('--ignore-admin')
    if (ignoreAdmin) args.splice(args.indexOf('--ignore-admin'), 1)
    // Find the user ID.
    const toGet = args.length === 0 ? message.author.id : args.shift()
    let user = getUser(message, toGet)
    if (!user && message.author.id === host && [18, 17].includes(toGet.length) && !isNaN(+toGet)) {
      try { user = await client.getRESTUser(toGet) } catch (e) { }
    }
    if (!user) return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Display permission info.
    const member = message.member.guild.members.get(user.id)
    const color = member
      ? (member.roles.map(i => member.guild.roles.get(i)).sort(
          (a, b) => a.position > b.position ? -1 : 1
        ).find(i => i.color !== 0) || { color: 0 }).color
      : 0
    const permissions = member.permissions
    const permissionKeys = Object.keys(permissions.json) as Array<keyof Constants['Permissions']>
    const channelPerm = (message.channel as GuildTextableChannel).permissionsOf(user.id)
    return {
      content: `✅ **Permissions of ${user.username}:**`,
      embeds: [{
        author: {
          name: `${user.username}#${user.discriminator}'s permissions`,
          icon_url: user.avatarURL
        },
        description: user.mention,
        color,
        fields: [
          {
            name: 'Guild Permissions',
            value: message.member.guild.ownerID === user.id && !ignoreAdmin
              ? 'Owner! (use `/perms --ignore-admin` to show perms regardless)'
              : permissions.has('administrator') && !ignoreAdmin
                ? 'Administrator! (use `/perms --ignore-admin` to show perms regardless)'
                : permissionKeys
                  .filter(perm => permissions.has(perm))
                  .map(perm => (perm.substr(0, 1).toUpperCase() + perm.substr(1))
                    .replace(/[A-Z]+/g, s => ' ' + s))
                  .join(', ').replace('TTSMessages', 'TTS Messages')
          },
          !(message.member.guild.ownerID === user.id || permissions.has('administrator')) || ignoreAdmin
            ? {
                name: 'Channel Permissions',
                value: (
                  permissionKeys
                    .filter(perm => !permissions.has(perm) && channelPerm.has(perm))
                    .map(perm => (perm.substr(0, 1).toUpperCase() + perm.substr(1))
                      .replace(/[A-Z]+/g, s => ' ' + s))
                    .join(', ') +
                permissionKeys
                  .filter(perm => permissions.has(perm) && !channelPerm.has(perm))
                  .map(perm => '**!(' + (perm.substr(0, 1).toUpperCase() + perm.substr(1))
                    .replace(/[^(][A-Z]+/g, s => s.substr(0, 1) + ' ' + s.substr(1)) + ')**')
                  .join(', ')
                ).replace('TTSMessages', 'TTS Messages')
              }
            : { name: '', value: '' }
        ].filter(e => !!e.value),
        footer: { text: 'User ID: ' + user.id }
      }]
    }
  }
}

export const handleRequest: Command = {
  name: 'request',
  aliases: ['req', 'suggest'],
  opts: {
    description: 'Request a specific feature.',
    fullDescription: 'Request a feature. 24 hour cooldown except for test pilots.',
    usage: '/request <suggestion>',
    example: '/request a /userinfo command.',
    options: [{
      name: 'suggestion',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: 'The feature you want to suggest, or the bug you wish to report. Please be detailed.'
    }]
  },
  generator: async ({ author }, args, { client, tempDB }) => {
    // Check for cooldown.
    if (!testPilots.includes(author.id) &&
      host !== author.id && tempDB.cooldowns.request.has(author.id)
    ) return 'This command is cooling down right now. Try again later.'
    await client.createMessage((await client.getDMChannel(host)).id,
      `${author.username}#${author.discriminator} with ID ${author.id}: ${args.join(' ')}`
    )
    // Add cooldown.
    if (!testPilots.includes(author.id) && host !== author.id) {
      tempDB.cooldowns.request.add(author.id)
      setTimeout(() => tempDB.cooldowns.request.delete(author.id), ms('1 day'))
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
      ) return { content: `**You don't have enough permissions for that, you ${getInsult()}.**`, error: true }
      args.shift()
      if (args.join(' ') === 'pls adim me') args = ['no']
      tempDB.say[message.channelMentions[0]] = (
        await client.createMessage(message.channelMentions[0], {
          content: args.join(' '),
          allowedMentions: {
            everyone: message.member && message.member.permissions.has('mentionEveryone'),
            users: true,
            roles: message.member && (
              message.member.permissions.has('mentionEveryone') ||
              message.member.guild.roles.filter(e => e.mentionable).map(e => e.id)
            )
          }
        })
      ).id
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
    return {
      content: args.join(' '),
      allowedMentions: {
        everyone: message.member && message.member.permissions.has('mentionEveryone'),
        users: true,
        roles: message.member && (
          message.member.permissions.has('mentionEveryone') ||
          message.member.guild.roles.filter(e => e.mentionable).map(e => e.id)
        )
      }
    }
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
      ) return { content: `**You don't have enough permissions for that, you ${getInsult()}.**`, error: true }
      args.shift()
      if (args.join(' ') === 'pls adim me') args = ['no']
      await client.sendChannelTyping(message.channelMentions[0])
      await (async ms => await new Promise(resolve => setTimeout(resolve, ms)))(
        args.join(' ').length * 120 > 8000 ? 8000 : args.join(' ').length * 120
      )
      tempDB.say[message.channelMentions[0]] = (
        await client.createMessage(message.channelMentions[0], {
          content: args.join(' '),
          allowedMentions: {
            everyone: message.member && message.member.permissions.has('mentionEveryone'),
            users: true,
            roles: message.member && (
              message.member.permissions.has('mentionEveryone') ||
              message.member.guild.roles.filter(e => e.mentionable).map(e => e.id)
            )
          }
        })
      ).id
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
    await message.channel.sendTyping()
    await (async ms => await new Promise(resolve => setTimeout(resolve, ms)))(
      args.join(' ').length * 120 > 8000 ? 8000 : args.join(' ').length * 120
    )
    return {
      content: args.join(' '),
      allowedMentions: {
        everyone: message.member && message.member.permissions.has('mentionEveryone'),
        users: true,
        roles: message.member && (
          message.member.permissions.has('mentionEveryone') ||
          message.member.guild.roles.filter(e => e.mentionable).map(e => e.id)
        )
      }
    }
  }
}

export const handleRemindme: Command = {
  name: 'remindme',
  aliases: ['rm', 'reminder', 'remind'],
  opts: {
    fullDescription: 'Remind you of something.',
    description: 'Reminders.',
    usage: '/remindme <time in 1d|1h|1m|1s> (--channel|-c) <description>',
    example: '/remindme 1h do your homework'
  },
  generator: async (message, args, { db }) => {
    let channel = false
    if (args[0] === '-c' || args[0] === '--channel') {
      args.splice(0, 1)
      channel = true
    } else if (args[1] === '-c' || args[1] === '--channel') {
      args.splice(1, 1)
      channel = true
    } else if (args[args.length - 1] === '-c' || args[args.length - 1] === '--channel') {
      args.splice(args.length - 1, 1)
      channel = true
    }
    if (args.length < 2 || !ms(args[0])) {
      return { content: 'Correct usage: /remindme <time in 1d|1h|1m|1s> (--channel|-c) <description>', error: true }
    }
    if (ms(args[0]) > 61 * 1000) { // Greater than 61 seconds and it's relegated to the database.
      try {
        const res = await db.collection('tasks').insertOne({
          type: 'reminder',
          time: Date.now() + ms(args[0]),
          user: message.author.id,
          target: channel ? message.channel.id : (await message.author.getDMChannel()).id,
          message: `⏰${
            channel ? message.author.mention + ' ' : ''
          } ${args.slice(1).join(' ')}\nReminder set ${args[0]} ago.`
        })
        if (!res.acknowledged) return 'Failed to add a reminder to the database!'
      } catch (e) { return 'Failed to add a reminder to the database!' + (channel ? '' : ' Can I DM you?') }
    } else {
      setTimeout(() => {
        (async () => {
          const textChannel = channel ? message.channel : await message.author.getDMChannel()
          const firstLine = channel
            ? `${message.author.mention} ${args.slice(1).join(' ')}`
            : args.slice(1).join(' ')
          await textChannel.createMessage(`⏰ ${firstLine}\nReminder set ${args[0]} ago.`)
        })().catch(() => {})
      }, ms(args[0]))
    }
    return `You will be reminded in ${args[0]} through a ${channel ? 'mention' : 'DM'}.`
  }
}

export const handleReminderlist: Command = {
  name: 'reminderlist',
  aliases: ['remindmelist', 'remindlist', 'rmlist', 'rml'],
  opts: {
    description: 'List the reminders I\'ve set.',
    fullDescription: 'List the reminders I\'ve set.',
    usage: '/reminderlist',
    example: '/reminderlist',
    argsRequired: false
  },
  generator: async (message, args, { db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length > 0 && message.author.id !== host) return { content: 'Correct usage: /reminderlist', error: true }
    // Now find the user ID.
    let user = args[0] && getUser(message, args[0])
    if (!user && (args.length > 0)) return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    else if (!user) user = message.author
    // Get a list of reminders.
    const id = user.id
    const reminders = await db.collection('tasks').find({ type: 'reminder', user: id }).toArray()
    // If the person has no reminders..
    if (reminders.length === 0) return '**No** reminders found.'
    // Generate the response.
    const format = 'dddd, MMMM Do YYYY, h:mm:ss A' // Date format.
    return {
      content: `⏰ **Reminders for ${user.username}#${user.discriminator}:**`,
      embeds: [{
        color: 0x00AE86,
        type: 'rich',
        title: 'Reminders',
        // This function generates the fields.
        fields: reminders.map((reminder, index) => ({
          name: `Reminder ${index + 1}`,
          // TODO: Switch to Discord timestamps for reminders.
          value: `**Due time:** ${moment(reminder.time).format(format)}
**Channel:** <#${reminder.target}>
**Message:** ${reminder.message.substring(1, reminder.message.lastIndexOf('\n')).trim()}`
        }))
      }]
    }
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
    let user: Message['author'] = getUser(message, args.join(' ')) || message.author
    if (!user && message.mentions.length !== 0) user = message.mentions[0]
    const member = message.member.guild.members.get(user.id)
    const format = user.avatar && user.avatar.startsWith('a_') ? 'gif' : 'png'
    return {
      content: '**Avatar:**',
      embeds: [{
        author: { name: `${user.username}#${user.discriminator}`, icon_url: user.avatarURL },
        image: { url: user.dynamicAvatarURL(format, 2048) },
        description: `**[Link](${user.dynamicAvatarURL(format, 2048)})**`,
        color: member.roles.map(i => member.guild.roles.get(i)).sort(
          (a, b) => a.position > b.position ? -1 : 1
        ).shift()?.color
      }]
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
  generator: async (message, args, { tempDB, client }) => {
    if (!tempDB.leave.has(message.author.id)) {
      tempDB.leave.add(message.author.id)
      setTimeout(() => {
        if (!tempDB.leave.has(message.author.id)) return
        message.channel.createMessage(message.author.mention + ' your leave request has timed out.')
          .then(() => tempDB.leave.delete(message.author.id))
          .catch(() => tempDB.leave.delete(message.author.id))
      }, 30000)
      return 'Are you sure you want to leave the server? ' +
        'You will require an invite link to join back. Type /leave to confirm.'
    } else {
      tempDB.leave.delete(message.author.id)
      try {
        await client.kickGuildMember(message.member.guild.id, message.author.id, 'Used /leave.')
      } catch (e) {
        return 'You will have to manually leave the server or transfer ownership before leaving.'
      }
      return `${message.author.username}#${message.author.discriminator} has left the server.`
    }
  }
}

export const handleListvoiceregions: Command = ({
  name: 'listvoiceregions',
  aliases: ['lsr', 'lvr'],
  opts: {
    fullDescription: 'List available voice regions.',
    description: 'List available voice regions.',
    usage: '/listvoiceregions',
    example: '/listvoiceregions',
    guildOnly: true,
    argsRequired: false
  },
  slashGenerator: ({ guildID }, { client }) => handleListvoiceregions.commonGenerator(guildID, client),
  generator: (message, args, { client }) => handleListvoiceregions.commonGenerator(message.guildID, client),
  commonGenerator: async (guild: string, client: Dysnomia.Client) => 'Available voice regions for this server: `' + (
    await client.getVoiceRegions(guild)
  ).map((value) => value.id).join('`, `') + '`'
})

export const handleChangevoiceregion: Command = {
  name: 'changevoiceregion',
  aliases: ['csr', 'cvr'],
  opts: {
    fullDescription: 'Changes the voice region of the voice channel.',
    description: 'Changes the voice region of the voice channel.',
    usage: '/changevoiceregion <voice channel name> <voice region or automatic>',
    example: '/changevoiceregion General 1 russia',
    guildOnly: true,
    requirements: {
      permissions: { manageGuild: true }
    },
    options: [{
      name: 'channel',
      description: 'The voice channel to edit the region of.',
      type: Constants.ApplicationCommandOptionTypes.CHANNEL,
      channel_types: [Constants.ChannelTypes.GUILD_VOICE, Constants.ChannelTypes.GUILD_STAGE_VOICE],
      required: true
    }, {
      name: 'region',
      description: 'The voice region to switch the channel to. Use /listvoiceregions.',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true
    }]
  },
  slashGenerator: (interaction, { client }) => {
    const channelOpt = interaction.data.options.find(option => option.name === 'channel') as
      Dysnomia.InteractionDataOptionsChannel
    const regionOpt = interaction.data.options.find(option => option.name === 'region') as
      InteractionDataOptionsString
    const ch = client.guilds.get(interaction.guildID).channels.get(channelOpt.value)
    if (!ch || ch.type !== 2) return { content: 'This voice channel does not exist!', error: true }
    return handleChangevoiceregion.commonGenerator(ch, regionOpt.value || 'auto', client)
  },
  generator: (message, args, { client }) => {
    if (!message.member.guild.members.get(client.user.id).permissions.has('manageGuild')) {
      return 'I require the Manage Server permission to do that..'
    }
    const rtcRegion = args.pop()
    const ch = getChannel(message, args.join(' '))
    if (!ch || ch.type !== 2) return { content: 'This voice channel does not exist!', error: true }
    return handleChangevoiceregion.commonGenerator(ch, rtcRegion, client)
  },
  commonGenerator: async (channel: Dysnomia.VoiceChannel, region: string, client: Dysnomia.Client) => {
    try {
      const { rtcRegion } = await channel.edit({
        rtcRegion: region === 'automatic' || region === 'auto' ? null : region
      })
      return 'Voice region changed to ' + (rtcRegion || 'auto') + ' \\o/'
    } catch (e) { return 'Invalid voice region.' }
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
      // if (message.member && !message.member.guild.channels.get(possibleChannel)
      //   .permissionsOf(message.member.id).has('sendMessages')
      // ) return `**You don't have enough permissions for that, you ${getInsult()}.**`
      const messageID = args.slice(1).shift()
      try {
        await client.editMessage(possibleChannel, messageID, args.slice(1).join(' '))
      } catch (e) { return { content: 'Nothing to edit.', error: true } }
      return
    }
    // Edit the message.
    const messageID = args.shift()
    try {
      await client.editMessage(message.channel.id, messageID, args.join(' '))
    } catch (e) { return { content: 'Nothing to edit.', error: true } }
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
      if (message.member && !message.member.guild.channels.get(possibleChannel)
        .permissionsOf(message.member.id).has('sendMessages')
      ) return { content: `**You don't have enough permissions for that, you ${getInsult()}.**`, error: true }
      // Edit the message.
      try {
        await client.editMessage(possibleChannel, tempDB.say[possibleChannel], args.slice(1).join(' '))
      } catch (e) { return { content: 'Nothing to edit.', error: true } }
      return
    }
    // Edit the message.
    try {
      await client.editMessage(message.channel.id, tempDB.say[message.channel.id], args.join(' '))
    } catch (e) { return { content: 'Nothing to edit.', error: true } }
  }
}

export const handleSuppressEmbed: Command = {
  name: 'suppressEmbed',
  aliases: ['suppressEmbeds', 'suppress'],
  opts: {
    requirements: {
      permissions: { manageMessages: true },
      custom: (message) => (
        (message.channel as GuildTextableChannel)
          .permissionsOf(message.author.id).has('manageMessages')
      )
    },
    description: 'Suppress or unsuppress embeds in a message.',
    fullDescription: 'Suppress or unsuppress embeds in a message.',
    usage: '/suppress (channel) <message ID/link/reply to a message>',
    example: '/suppress #general 123456789012345678',
    argsRequired: false
  },
  generator: async (message, args, { client }) => {
    let msg
    console.log(args)
    console.log(message.messageReference)
    if (args.length === 0 && message.messageReference) {
      const { channelID, messageID } = message.messageReference
      msg = message.referencedMessage || await client.getMessage(channelID, messageID)
    } else if (args.length === 1) {
      const regex = /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
      if (regex.test(args[0])) {
        const split = args[0].split('/')
        const channel = message.member.guild.channels.get(split[5]) as GuildTextableChannel
        if (!channel || channel.type !== 0) return { content: `That's not a real channel, you ${getInsult()}.`, error: true }
        msg = channel.messages.get(split[6]) || await channel.getMessage(split[6])
      } else {
        msg = message.channel.messages.get(args[0]) || await message.channel.getMessage(args[0])
      }
    } else if (args.length === 2) {
      const channel = message.member.guild.channels.get(getIdFromMention(args[0])) as GuildTextableChannel
      if (channel && channel.type === 0) {
        msg = channel.messages.get(args[1]) || await channel.getMessage(args[1])
      } else return { content: `That's not a real channel, you ${getInsult()}.`, error: true }
    } else return { content: 'Correct usage: /suppress (channel) <message ID/link/reply to a message>', error: true }

    if (msg) {
      await msg.edit({ flags: msg.flags ^ Constants.MessageFlags.SUPPRESS_EMBEDS })
      message.addReaction('✅').catch(() => {}) // Ignore error.
    } else return { content: `That's not a real message, you ${getInsult()}.`, error: true }
  }
}

export const handleCalculate: Command = {
  name: 'calculate',
  aliases: ['calc', 'cal'],
  opts: {
    description: 'Calculate an expression.',
    fullDescription: `Calculate the value of an expression.
More info here: https://mathjs.org/docs/expressions/syntax.html`,
    usage: '/calculate <expression>',
    example: '/calculate 2 + 2',
    invalidUsageMessage: 'Specify an expression >_<',
    options: [{
      name: 'expression',
      description: 'The math expression to be evaluated.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => handleCalculate.commonGenerator(
    (interaction.data.options[0] as InteractionDataOptionsString).value
  ),
  generator: (message, args) => handleCalculate.commonGenerator(args.join(' ')),
  commonGenerator: (expression: string) => {
    try {
      return `${evaluate(expression.split(',').join('.').split('÷').join('/').toLowerCase())}`.trim()
    } catch (e) {
      return { content: 'Invalid expression >_<', error: true }
    }
  }
}

const cToF = (c: number): number => +((c * 9 / 5) + 32).toFixed(2)
const cToK = (c: number): number => +((c + 273.15).toFixed(2))
const fToC = (f: number): number => +(((f - 32) * 5 / 9).toFixed(2))
const kToC = (k: number): number => +((k - 273.15).toFixed(2))

export const handleTemperature: Command = {
  name: 'temperature',
  aliases: ['temp'],
  opts: {
    description: 'Convert between temperature units.',
    fullDescription: 'Convert between temperature units.',
    usage: '/temperature <temperature>',
    example: '/temperature 100C',
    invalidUsageMessage: 'Specify a temperature ending in C, F or K.',
    options: [{
      name: 'temperature',
      description: 'The temperature to be converted, ending in C, F or K.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => handleTemperature.commonGenerator(
    (interaction.data.options[0] as InteractionDataOptionsString).value
  ),
  generator: (message, args) => handleTemperature.commonGenerator(args[0]),
  commonGenerator: (temp: string) => {
    const regex = /^(-?\d+.?\d*) ?°? ?([CFK])$/i
    const match = regex.exec(temp)
    if (!match) return { content: 'Specify a temperature ending in C, F or K.', error: true }
    const value = +match[1]
    const unit = match[2].toLowerCase()
    const result = `**${value}°${unit.toUpperCase()}** is:`
    if (unit === 'c') {
      return result + `\n**${cToF(value)}°F** (Fahrenheit)` + `\n**${cToK(value)}K** (Kelvin)`
    } else if (unit === 'f') {
      return result + `\n**${fToC(value)}°C** (Celsius)` + `\n**${cToK(fToC(value))}K** (Kelvin)`
    } else {
      return result + `\n**${kToC(value)}°C** (Celsius)` + `\n**${cToF(kToC(value))}°F** (Fahrenheit)`
    }
  }
}
