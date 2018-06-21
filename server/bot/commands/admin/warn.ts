import * as moment from 'moment'
import { IveBotCommand } from '../../imports/types'
import { getUser, getInsult } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'

export const handleWarn: IveBotCommand = ({ createMessage, getDMChannel }, tempDB, db) => ({
  name: 'warn',
  opts: {
    description: 'Warn someone.',
    fullDescription: 'Warn someone.',
    usage: '/warn <user by ID/username/mention> <reason>',
    guildOnly: true,
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args) => {
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
    createMessage(
      (await getDMChannel(user.id)).id,
      `You have been warned in ${message.member.guild.name} for: ${args.join(' ')}.`
    )
    const member = message.member.guild.members.find(i => i.user === user)
    if (message.member.guild.id === '402423671551164416') {
      createMessage('402435742925848578', {
        content: `**${member.username}#${member.discriminator}** has been warned:`,
        embed: {
          color: 0x00AE86,
          type: 'rich',
          title: 'Information',
          description: `
**| Moderator:** ${message.author.username}#${message.author.discriminator} **| Reason:** ${args.join(' ')}
**| Date:** ${moment(new Date().toUTCString()).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
        }
      })
    }
    return `**${member.username}#${member.discriminator}** has been warned. **lol.**`
  }
})

export const handleWarnings: IveBotCommand = (client, tempDB, db) => ({
  name: 'warnings',
  opts: {
    description: 'Find out about a person\'s warnings.',
    fullDescription: 'Find out about a person\'s warnings.',
    usage: '/warnings (user by ID/username/mention)',
    aliases: ['warns'],
    guildOnly: true,
    requirements: {
      permissions: { 'manageMessages': true },
      custom: (message) => (
        getUser(message, message.content.split(' ')[1]).id === message.author.id ||
        message.content.split(' ').length === 1
      )
    }
  },
  generator: async (message, args) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length > 1) return 'Correct usage: /warnings (user by ID/username/mention)'
    // Now find the user ID.
    let user = getUser(message, args[0])
    if (!user && args.length) return `Specify a valid member of this guild, ${getInsult()}.`
    else user = message.author
    // Get a list of warnings.
    const warns = await db.collection('warnings').find({
      warnedID: user.id, serverID: message.member.guild.id
    }).toArray()
    // If the person has no warnings..
    if (warns.length === 0) return '**No** warnings found.'
    // Generate the response.
    const format = 'dddd, MMMM Do YYYY, h:mm:ss A' // Date format.
    return {
      content: `🛃 **Warnings for ${message.member.username}#${message.member.discriminator}:**`,
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
})
