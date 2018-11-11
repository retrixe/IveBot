import * as moment from 'moment'
import { ObjectID } from 'mongodb'
import { Command } from '../../imports/types'
import { getUser, getInsult } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'

export const handleWarn: Command = {
  name: 'warn',
  opts: {
    description: 'Warn someone.',
    fullDescription: 'Warn someone.',
    usage: '/warn <user by ID/username/mention> <reason>',
    example: '/warn voldemort you is suck',
    guildOnly: true,
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args, { client, db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length < 2) return 'Correct usage: /warn <user> <reason>'
    // Now find the user ID.
    let user = getUser(message, args[0])
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user)) >=
      checkRolePosition(message.member)
    ) {
      return `You cannot warn this person, you ${getInsult()}.`
    }
    // Warn the person internally.
    args.shift()
    await db.collection('warnings').insertOne({
      warnedID: user.id,
      warnerID: message.author.id,
      reason: args.join(' '),
      serverID: message.member.guild.id,
      date: new Date().toUTCString()
    })
    client.createMessage(
      (await client.getDMChannel(user.id)).id,
      `You have been warned in ${message.member.guild.name} for: ${args.join(' ')}.`
    )
    if (message.member.guild.id === '402423671551164416') {
      client.createMessage('402435742925848578', {
        content: `**${user.username}#${user.discriminator}** has been warned:`,
        embed: {
          color: 0x00AE86,
          type: 'rich',
          title: 'Information',
          description: `
  *| Moderator:** ${message.author.username}#${message.author.discriminator} **| Reason:** ${args.join(' ')}
  *| Date:** ${moment(new Date().toUTCString()).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
        }
      })
    }
    return `**${user.username}#${user.discriminator}** has been warned. **lol.**`
  }
}

export const handleWarnings: Command = {
  name: 'warnings',
  aliases: ['warns'],
  opts: {
    description: 'Find out about a person\'s warnings.',
    fullDescription: 'Find out about a person\'s warnings.',
    usage: '/warnings (user by ID/username/mention)',
    example: '/warnings voldemort',
    guildOnly: true,
    argsRequired: false,
    requirements: {
      permissions: { 'manageMessages': true },
      custom: (message) => {
        return message.content.split(' ')[1]
          ? getUser(message, message.content.split(' ')[1]).id === message.author.id
          : message.content.split(' ').length === 1
      }
    }
  },
  generator: async (message, args, { client, db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length > 1) return 'Correct usage: /warnings (user by ID/username/mention)'
    // Now find the user ID.
    let user = args[0] && getUser(message, args[0])
    if (!user && args.length) return `Specify a valid member of this guild, ${getInsult()}.`
    else if (!user) user = message.author
    // Get a list of warnings.
    const warns = await db.collection('warnings').find({
      warnedID: user.id, serverID: message.member.guild.id
    }).toArray()
    // If the person has no warnings..
    if (warns.length === 0) return '**No** warnings found.'
    // Generate the response.
    const format = 'dddd, MMMM Do YYYY, h:mm:ss A' // Date format.
    return {
      content: `🛃 **Warnings for ${user.username}#${user.discriminator}:**`,
      embed: {
        color: 0x00AE86,
        type: 'rich',
        title: 'Warnings',
        // This function generates the fields.
        fields: warns.map((warning, index) => {
          // If we could find the warner then we specify his/her username+discriminator else ID.
          const warner = client.users.find(i => i.id === warning.warnerID)
          const mod = warner ? `${warner.username}#${warner.discriminator}` : warning.warnerID
          return {
            name: `Warning ${index + 1}`,
            value: `**| Moderator:** ${mod} **| Reason:** ${warning.reason}
**| ID:** ${warning._id} **| Date:** ${moment(warning.date).format(format)}`
          }
        })
      }
    }
  }
}

export const handleClearwarns: Command = {
  name: 'clearwarns',
  aliases: ['cw', 'clearw'],
  opts: {
    description: 'Clear all warnings a person has.',
    fullDescription: 'Clear all warnings a person has.',
    usage: '/clearwarns <user by ID/username/mention>',
    guildOnly: true,
    example: '/clearwarns voldemort',
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args, { db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length !== 1) return 'Correct usage: /clearwarns <user>'
    // Now find the user ID.
    let user = getUser(message, args.shift())
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user)) >=
      checkRolePosition(message.member)
    ) {
      return `You cannot clear the warnings of this person, you ${getInsult()}.`
    }
    // Clear the warns of the person internally.
    try {
      await db.collection('warnings').deleteMany({
        warnedID: user.id, serverID: message.member.guild.id
      })
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    // Return response.
    return `Warnings of **${user.username}#${user.discriminator}** have been **cleared**.`
  }
}

export const handleRemovewarn: Command = {
  name: 'removewarn',
  aliases: ['rw', 'removew', 'deletewarn', 'deletew', 'dw'],
  opts: {
    description: 'Remove a single warning from a person.',
    fullDescription: 'Remove a single warning from a person.',
    usage: '/removewarn <user by ID/username/mention> <warning ID>',
    guildOnly: true,
    example: '/removewarn voldemort 5adf7a0e825aa7005a4e7be2',
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args, { db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length !== 2) return 'Correct usage: /removewarn <user> <warning ID>'
    // Now find the user ID.
    let user = getUser(message, args.shift())
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user)) >=
      checkRolePosition(message.member)
    ) {
      return `You cannot remove a warning from this person, you ${getInsult()}.`
    }
    // Remove the warning of the person internally.
    try {
      const warn = await db.collection('warnings').findOne({
        _id: new ObjectID(args[0]), serverID: message.member.guild.id
      })
      if (!warn) return 'This warning does not exist..'
      else if (warn.warnedID !== user.id) {
        return 'This warning does not belong to the specified user..'
      }
      try {
        await db.collection('warnings').deleteOne({
          _id: new ObjectID(args[0]), serverID: message.member.guild.id
        })
      } catch (e) { return `Something went wrong 👾 Error: ${e}` }
    } catch (err) { return `Something went wrong 👾 Error: ${err}` }
    // Return response.
    return '**Warning has been deleted.**'
  }
}
