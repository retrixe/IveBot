import { getArguments, getIdFromMention } from '../imports/tools'
// Get types.
import { client, message, DB } from '../imports/types'
import { User } from 'eris'
import 'json5/lib/require'
import { host } from '../../../config.json5'
import * as ms from 'ms'

export function handleRequest (client: client, user: User, sendResponse: Function, message: string) {
  client.getDMChannel(host).then((PrivateChannel) => {
    client.createMessage(
      PrivateChannel.id,
      `${user.username}#${user.discriminator} with ID ${user.id}: ${getArguments(message)}`
    )
  })
  sendResponse(`${user.mention}, what a pathetic idea. It has been DMed to the main developer and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`)
}

export function handleSay (message: message, sendResponse: Function, client: client, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (message.member.permission.has('manageMessages')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage(message.channel.id, message.id)
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message.content).split(' ')[0])
  if (message.channelMentions[0] === possibleChannel) {
    client.createMessage(message.channelMentions[0], getArguments(getArguments(message.content)))
      .then((newMessage) => { db.say[message.channelMentions[0]] = newMessage.id })
      .catch(() => sendResponse('There was an error processing your request.'))
    return
  }
  // Send the message all over again.
  sendResponse(getArguments(message.content))
    .then((newMessage: { id: string }) => { db.say[message.channel.id] = newMessage.id })
    .catch(() => sendResponse('There was an error processing your request.'))
}

export function handleEditLastSay (message: message, sendResponse: Function, client: client, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (message.member.permission.has('manageMessages')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage(message.channel.id, message.id)
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message.content).split(' ')[0])
  if (message.channelMentions[0] === possibleChannel) {
    client.editMessage(possibleChannel, db.say[possibleChannel], getArguments(getArguments(
      message.content
    ))).catch(() => sendResponse('Nothing to edit.'))
    return
  }
  // Edit the message all over again.
  client.editMessage(message.channel.id, db.say[possibleChannel], getArguments(
    message.content
  )).catch(() => sendResponse('Nothing to edit.'))
}

export function handleType (message: message, sendResponse: Function, client: client, testPilot: string, db: DB) {
  // Check for enough permissions.
  let check = false
  if (message.member.permission.has('manageMessages')) check = true
  else if (testPilot) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage(message.channel.id, message.id)
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message.content).split(' ')[0])
  if (message.channelMentions[0] === possibleChannel) {
    client.sendChannelTyping(possibleChannel)
    setTimeout(() => {
      client.createMessage(message.channelMentions[0], getArguments(getArguments(message.content)))
        .then((newMessage) => { db.say[message.channelMentions[0]] = newMessage.id })
        .catch(() => sendResponse('There was an error processing your request.'))
    }, message.content.length * 120 > 8000 ? 8000 : message.content.length * 120)
    return
  }
  // Send the message all over again.
  client.sendChannelTyping(possibleChannel)
  setTimeout(() => {
    sendResponse(getArguments(message.content))
      .then((newMessage: { id: string }) => { db.say[message.channel.id] = newMessage.id })
      .catch(() => sendResponse('There was an error processing your request.'))
  }, message.content.length * 120 > 8000 ? 8000 : message.content.length * 120)
}

export function handleEdit (message: message, sendResponse: Function, client: client) {
  // Check for enough permissions.
  let check = false
  if (message.member.permission.has('manageMessages')) check = true
  else if (host === message.author.id) check = true
  if (!check) {
    sendResponse('You cannot fool me. You do not have enough permissions.')
    return
  }
  // Delete the message.
  client.deleteMessage(message.channel.id, message.id)
  // Should it be edited in another channel?
  const possibleChannel = getIdFromMention(getArguments(message.content).split(' ')[0])
  if (possibleChannel === message.channelMentions[0]) {
    client.editMessage(
      possibleChannel, getArguments(getArguments(message.content)).split(' ')[0],
      getArguments(getArguments(getArguments(message.content)))
    ).catch(() => sendResponse('Nothing to edit.'))
    return
  }
  // Send the message all over again.
  client.editMessage(
    message.channel.id, getArguments(message.content).split(' ')[0],
    getArguments(getArguments(message.content))
  ).catch(() => sendResponse('Nothing to edit.'))
}

export function handleAvatar (message: string, sendResponse: Function, client: client, userID: string) {
  let user: string = getIdFromMention(getArguments(message).split(' ')[0])
  if (!user) user = userID
  if (!client.users.find(userElement => userElement.id === user).avatarURL) {
    sendResponse(
      'Link: https://cdn.discordapp.com/embed/avatars/' +
      +client.users.find(userElement => userElement.id === user).discriminator % 5 +
      '.png?size=2048'
    )
    return
  }
  sendResponse('Link: ' + client.users.find(E => E.id === user).avatarURL + '?size=2048')
}

export function handleRemindme (
  message: string, sendResponse: Function, client: client, userID: string
) {
  if (message.split(' ').length < 3 || !ms(message.split(' ')[1])) {
    sendResponse('Correct usage: /remindme <time in 1d|1h|1m|1s> <description>')
    return
  }
  const description = getArguments(getArguments(message))
  sendResponse(`You will be reminded in ${message.split(' ')[1]} - ${description} - through a DM.`)
  setTimeout(() => {
    client.getDMChannel(userID).then((PrivateChannel) => client.createMessage(
      PrivateChannel.id, `⏰ ${description}\nReminder set ${message.split(' ')[1]} ago.`
    ))
  }, ms(message.split(' ')[1]))
}

// List server regions!
export function handleListserverregions (client: client, event: message, message: string, sendResponse: Function) {
  client.getVoiceRegions(event.member.guild.id).then((listOfServer) => {
    // Fix.
  })
  sendResponse('Available server regions: `brazil`, `frankfurt`, `amsterdam`, ' +
  '`london`, `singapore`, `us-east`, `us-central`, `us-south`, `us-west`, ' + '`sydney`, ' +
  '`japan`, `russia` and `hongkong`.')
}

export function handleChangeserverregion (client: client, event: message, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!event.member.permission.json.manageGuild) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (!event.member.guild.members.find(a => a.id === client.user.id).permission.has('manageGuild')) {
    sendResponse('I require the Manage Server permission to do that..')
  } else if (message.split(' ').length !== 2) {
    sendResponse('Correct usage: /changeserverregion <valid server region, /listserverregion>')
    return
  }
  client.editGuild(event.member.guild.id, {
    region: getArguments(message)
  }).then(() => sendResponse('Voice region changed to `' + getArguments(message) + '` \\o/'))
    .catch(() => sendResponse('Invalid server voice region.'))
}
