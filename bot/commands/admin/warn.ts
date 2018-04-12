import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkUserForPermission } from '../../imports/permissions'
// Get types.
import { client, event, mongoDB } from '../../imports/types'
// Get moment.js
import * as moment from 'moment'

// Warn.
export function handleWarn (client: client, event: event, sendResponse: Function, message: string, db: mongoDB) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (getArguments(message).split(' ').length < 2) {
    sendResponse('Correct usage: /warn <user> <reason>')
    return
  }
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const a = client.users[userID]
  if (!a) {
    sendResponse('Please specify a valid user.')
    return
  }

  // userID and server name.
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // Reason.
  const reason = getArguments(getArguments(message))
  // Set up the mutation.
  let warned = true
  const serverID = client.channels[event.d.channel_id].guild_id
  const warningCollection = db.collection('warnings')
  warningCollection.insertOne({
    warnedID: userID,
    warnerID: event.d.author.id,
    reason: reason,
    serverID,
    date: new Date().toUTCString()
  }).catch((err: string) => {
    sendResponse(`Something went wrong 👾 Error: ${err}`)
    warned = false
  })
  // DM the poor user.
  setTimeout(() => {
    if (warned) {
      client.sendMessage({
        to: userID,
        message: `You have been warned in ${serverName} for: ${reason}.`
      })
      const user = client.users[userID]
      sendResponse(`**${user.username}#${user.discriminator}** has been warned. **lol.**`)
    }
    if (warned && serverID === '402423671551164416') {
      const user = client.users[userID]
      client.sendMessage({
        to: '427911595352391680',
        message: `**${user.username}#${user.discriminator}** has been warned:`,
        embed: {
          color: 0x00AE86,
          type: 'rich',
          title: 'Information',
          description: `
**| Moderator:** ${event.d.author.username}#${event.d.author.discriminator} **| Reason:** ${getArguments(getArguments(message))}
**| Date:** ${moment(new Date().toUTCString()).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
        }
      })
    }
  }, 1000)
}

// Warnings.
export function handleWarnings (client: client, event: event, sendResponse: Function, message: string, db: mongoDB) {
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const a = client.users[userID]
  if (!a) {
    sendResponse('Please specify a valid user.')
    return
  }
  // Check user for permissions.
  let notPermitted = false
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    notPermitted = true
  } else if (getArguments(message).split(' ').length < 1) {
    sendResponse('Correct usage: /warnings <user>')
    return
  }
  if (userID === event.d.author.id) notPermitted = false
  if (notPermitted) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Set up the mutation.
  const serverID = client.channels[event.d.channel_id].guild_id
  const warningCollection = db.collection('warnings')
  warningCollection.find({
    warnedID: userID,
    serverID
  }).toArray().then((array: Array<{ warnerID: string, date: string, reason: string, _id: string }>) => {
    let response = ``
    if (array.length === 0) {
      sendResponse('**No** warnings found.')
      return
    }
    for (let x = 0; x < array.length; x++) {
      const a = client.users[array[x].warnerID]
      if (response) response += '\n\n'
      response += `**Warning ${x + 1}**
**| Moderator:** ${a.username}#${a.discriminator} **| Reason:** ${array[x].reason}
**| ID:** ${array[x]._id} **| Date:** ${moment(array[x].date).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
    }
    client.sendMessage({
      to: event.d.channel_id,
      message: `**Warnings for ${a.username}#${a.discriminator}:**`,
      embed: {
        color: 0x00AE86,
        type: 'rich',
        title: 'Warnings',
        description: response
      }
    })
  })
}

// Remove warn.
export function handleRemovewarn (client: client, event: event, sendResponse: Function, message: string, db: mongoDB) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (getArguments(message).split(' ').length !== 1) {
    sendResponse('Correct usage: /removewarn <warn ID>')
    return
  }

  // ID.
  const id = getArguments(getArguments(message))
  // Set up the mutation.
  const warningCollection = db.collection('warnings')
  warningCollection.deleteOne({
    _id: id
  }).then(() => sendResponse('Warning deleted.'), (err: string) => {
    if (err) sendResponse('Send a proper ID of a warning obtainable through /warnings.')
  })
}
