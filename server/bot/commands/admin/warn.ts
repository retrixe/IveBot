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
  generator: (message, args) => {
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
    db.collection('warnings').insertOne({
      warnedID: user,
      warnerID: message.author.id,
      reason: args.join(' '),
      serverID: message.member.guild.id,
      date: new Date().toUTCString()
    }).then(() => {
      getDMChannel(user.id).then((c) => createMessage(
        c.id, `You have been warned in ${message.member.guild.name} for: ${args.join(' ')}.`
      ))
      const member = message.member.guild.members.find(i => i.user === user)
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
    }).catch(console.error /* (err: string) => {
      createMessage(message.channel.id, `Something went wrong 👾 Error: ${err}`)
    } */)
  }
})
