// All the types!
import { Message } from 'eris' // eslint-disable-line no-unused-vars
import { IveBotCommand } from '../imports/types'
// All the needs!
import { getIdFromMention, getDesc } from '../imports/tools'
import * as ms from 'ms'
import 'json5/lib/require'
import { host, testPilots } from '../../../config.json5'

export const handleRequest: IveBotCommand = (client, db) => ({
  name: 'request',
  opts: {
    aliases: ['req'],
    requirements: { userIDs: [...testPilots, host] },
    description: 'Request a specific feature.',
    fullDescription: 'Request a feature. Only available to test pilots.',
    usage: '/request <suggestion>'
  },
  generator: ({ author, content, channel }, args) => {
    client.getDMChannel(host).then((PrivateChannel) => {
      client.createMessage(
        PrivateChannel.id,
        `${author.username}#${author.discriminator} with ID ${author.id}: ${args.join(' ')}`
      )
    })
    return `${author.mention}, what a pathetic idea. It has been DMed to the main developer \
and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`
  }
})

export const handleSay: IveBotCommand = (client, db) => ({
  opts: {
    requirements: { userIDs: [...testPilots, host], permissions: { manageMessages: true } },
    permissionMessage: 'You cannot fool me. You do not have enough permissions.',
    description: 'Say something, even in another channel.',
    fullDescription: 'Say something. Test pilots and admins/mods only.',
    usage: '/say (channel) <text>',
    deleteCommand: true,
    errorMessage: 'There was an error processing your request.'
  },
  name: 'say',
  generator: (message, args) => {
    // Should it be sent in another channel?
    const possibleChannel = getIdFromMention(args[0])
    if (message.channelMentions[0] === possibleChannel) {
      args.shift()
      if (args.join(' ') === 'pls adim me') args = ['no']
      client.createMessage(message.channelMentions[0], args.join(' ')).then((newMessage) => {
        db.say[message.channelMentions[0]] = newMessage.id
      }).catch((err) => console.error(err))
      return
    }
    // Send the message.
    if (args.join(' ') === 'pls adim me') args = ['no']
    client.createMessage(message.channel.id, args.join(' ')).then((newMessage) => {
      db.say[message.channelMentions[0]] = newMessage.id
    }).catch((err) => console.error(err))
  }
})

export const handleRemindme: IveBotCommand = (client) => ({
  opts: {
    fullDescription: 'Remind you of something.',
    description: 'Reminders.',
    usage: '/remindme <time in 1d|1h|1m|1s> <description>',
    aliases: ['rm']
  },
  name: 'remindme',
  generator: (message, args) => {
    if (args.length < 2 || !ms(args[0])) {
      return 'Correct usage: /remindme <time in 1d|1h|1m|1s> <description>'
    }
    client.createMessage(message.channel.id, `You will be reminded in ${args[0]} through a DM.`)
    setTimeout(() => {
      client.getDMChannel(message.author.id).then((PrivateChannel) => client.createMessage(
        PrivateChannel.id, `⏰ ${getDesc(message)}\nReminder set ${args[0]} ago.`
      ))
    }, ms(args[0]))
  }
})

export const handleAvatar: IveBotCommand = (client) => ({
  opts: {
    fullDescription: 'Get a large-sized link to the avatar of a user.',
    description: 'Avatar of a user.',
    usage: '/avatar <user>',
    aliases: ['av'],
    argsRequired: false
  },
  name: 'avatar',
  generator: (message, args) => {
    let user: Message['author'] = message.author
    if (message.mentions.length !== 0) user = message.mentions[0]
    return 'Link: ' + user.avatarURL.split('128').join('') + '2048'
  }
})

export const handleLeave: IveBotCommand = (client, db) => ({
  opts: {
    description: 'Makes you leave the server.',
    fullDescription: 'This kicks you from the server, essentially making you leave.',
    usage: '/leave',
    errorMessage: 'There was an error processing your request.',
    guildOnly: true,
    argsRequired: false
  },
  name: 'leave',
  generator: (message) => {
    if (!db.leave.includes(message.author.id)) {
      client.createMessage(
        message.channel.id,
        'Are you sure you want to leave the server? ' +
        'You will require an invite link to join back. Type /leave to confirm.'
      )
      db.leave.push(message.author.id)
      setTimeout(() => {
        if (db.leave.findIndex(i => i === message.author.id) === -1) return
        client.createMessage(message.channel.id, 'Your leave request has timed out.')
        db.leave.splice(db.leave.findIndex(i => i === message.author.id), 1)
      }, 30000)
    } else if (db.leave.includes(message.author.id)) {
      db.leave.splice(db.leave.findIndex(i => i === message.author.id), 1)
      client.kickGuildMember(message.member.guild.id, message.author.id, 'Used /leave.')
        .then(() => client.createMessage(
          message.channel.id,
          `${message.author.username}#${message.author.discriminator} has left the server.`
        )).catch(() => client.createMessage(
          message.channel.id,
          'You will have to manually leave the server or transfer ownership before leaving.'
        ))
    }
  }
})
