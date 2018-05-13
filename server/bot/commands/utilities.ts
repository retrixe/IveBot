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
      client.createMessage(message.channelMentions[0], args.join(' ')).then((newMessage) => {
        db.say[message.channelMentions[0]] = newMessage.id
      }).catch((err) => console.error(err))
      return
    }
    // Send the message.
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
