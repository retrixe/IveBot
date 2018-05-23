import * as moment from 'moment'
import { IveBotCommand } from '../../imports/types'
import { getIdFromMention } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'

export const handleWarn: IveBotCommand = ({ createMessage, getDMChannel }, tempDB, db) => ({
  name: 'warn',
  opts: {
    description: 'Warn someone.',
    fullDescription: 'Warn someone.',
    usage: '/warn <user by ID/username/mention> <reason>',
    guildOnly: true
  },
  generator: (message, args) => {
    // Check user for permissions.
    if (!message.member.permission.has('manageMessages')) {
      return '**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**'
    // Or if improper arguments were provided, then we must inform the user.
    } else if (args.length < 2) return 'Correct usage: /warn <user> <reason>'
    // Now find the user ID.
    let user: string = args[0]
    if (message.member.guild.members.find(i => i.id === args[0])) user = args[0]
    else if (message.mentions[0].id === getIdFromMention(args[0])) user = message.mentions[0].id
    else if (message.member.guild.members.find(i => i.username === args[0])) {
      user = message.member.guild.members.find(i => i.username === args[0]).id
    } else return 'Specify a valid member of this guild, pathetic life form.'
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.id === user)) >=
      checkRolePosition(message.member)
    ) {
      return 'You cannot warn this person! People nowadays.'
    }
    // Warn the person internally.
    args.shift()
    db.collection('warnings').insertOne({
      warnedID: user,
      warnerID: message.author.id,
      reason: args.join(' '),
      serverID: message.member.guild.id,
      date: new Date().toUTCString()
    }).then(() => {
      getDMChannel(user).then((c) => createMessage(
        c.id, `You have been warned in ${message.member.guild.name} for: ${args.join(' ')}.`
      ))
      const member = message.member.guild.members.find(i => i.id === user)
      createMessage(
        message.channel.id,
        `**${member.username}#${member.discriminator}** has been warned. **lol.**`
      )
      if (message.member.guild.id === '402423671551164416') {
        createMessage('427911595352391680', {
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
    }).catch((err: string) => {
      createMessage(message.channel.id, `Something went wrong 👾 Error: ${err}`)
    })
  }
})
