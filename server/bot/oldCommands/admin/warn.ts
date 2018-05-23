import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event, mongoDB } from '../../imports/types'
import { ObjectID } from 'mongodb'
// Get moment.js
import * as moment from 'moment'

// Warnings.
export function handleWarnings (client: client, event: event, sendResponse: Function, message: string, db: mongoDB) {
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (event.member.guild.members.find(a => a.id === ifUserId)) userID = ifUserId
  else if (
    event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase())
  ) userID = event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const member = event.member.guild.members.find(a => a.id === userID)
  if (!member && userID) {
    sendResponse('Please specify a valid user.')
    return
  } else if (!member) {
    userID = event.author.id
  }
  // Check user for permissions.
  let notPermitted = false
  if (!event.member.permission.has('manageMessages')) notPermitted = true
  else if (getArguments(message).split(' ').length < 1) {
    sendResponse('Correct usage: /warnings <user>')
    return
  }
  if (userID === event.author.id) notPermitted = false
  if (notPermitted) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Set up the mutation.
  const serverID = event.member.guild.id
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
      const a = client.users.find(i => i.id === array[x].warnerID)
      if (response) response += '\n\n'
      const modUsername = a ? a.username : array[x].warnerID
      const modDiscriminator = a ? '#' + a.discriminator : ''
      response += `**Warning ${x + 1}**
**| Moderator:** ${modUsername}${modDiscriminator} **| Reason:** ${array[x].reason}
**| ID:** ${array[x]._id} **| Date:** ${moment(array[x].date).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
    }
    client.createMessage(event.channel.id, {
      content: `**Warnings for ${member.username}#${member.discriminator}:**`,
      embed: {
        color: 0x00AE86,
        type: 'rich',
        title: 'Warnings',
        description: response
      }
    })
  })
}

// Clear warns.
export function handleClearwarns (client: client, event: event, sendResponse: Function, message: string, db: mongoDB) {
  // Check user for permissions.
  if (!event.member.permission.has('manageMessages')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (getArguments(message).split(' ').length < 1) {
    sendResponse('Correct usage: /clearwarns <user>')
    return
  }
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (event.member.guild.members.find(a => a.id === ifUserId)) userID = ifUserId
  else if (
    event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase())
  ) userID = event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase()).id
  const member = event.member.guild.members.find(a => a.id === userID)
  if (!member) {
    sendResponse('Please specify a valid user.')
    return
  }
  // Respect role order.
  if (checkRolePosition(member) >= checkRolePosition(event.member)) {
    sendResponse('You cannot clear the warnings of this person! People nowadays.')
    return
  }
  // Set up the mutation.
  let warned = true
  const serverID = event.member.guild.id
  const warningCollection = db.collection('warnings')
  warningCollection.deleteMany({ warnedID: userID, serverID }).catch((err: string) => {
    sendResponse(`Something went wrong 👾 Error: ${err}`)
    warned = false
  })
  // DM the poor user.
  setTimeout(() => {
    if (warned) {
      sendResponse(`Warnings of **${member.username}#${member.discriminator}** have been **cleared**.`)
    }
  }, 1000)
}

// Clear warns.
export function handleRemovewarn (client: client, event: event, sendResponse: Function, message: string, db: mongoDB) {
  // Check user for permissions.
  if (!event.member.permission.has('manageMessages')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  } else if (getArguments(message).split(' ').length < 2) {
    sendResponse('Correct usage: /removewarn <user> <warning ID>')
    return
  }
  // Check for valid user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (event.member.guild.members.find(a => a.id === ifUserId)) userID = ifUserId
  else if (
    event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase())
  ) userID = event.member.guild.members.find(a => a.username.toLowerCase() === ifUserId.toLowerCase()).id
  // eslint-disable-next-line no-unused-vars
  const member = event.member.guild.members.find(a => a.id === userID)
  if (!member) {
    sendResponse('Please specify a valid user.')
    return
  }
  // Respect role order.
  if (checkRolePosition(member) >= checkRolePosition(event.member)) {
    sendResponse('You cannot remove a warning from this person! People nowadays.')
    return
  }
  // Set up the mutation.
  let warned = true
  const serverID = event.member.guild.id
  const warningCollection = db.collection('warnings')
  warningCollection.find({ _id: new ObjectID(getArguments(getArguments(message))) })
    .toArray().catch((err: string) => {
      sendResponse(`Something went wrong 👾 Error: ${err}`)
      warned = false
    }).then((array: Array<{ warnedID: string, serverID: string, _id: string }>) => {
      if (array.length === 0) {
        sendResponse('This warning does not exist.')
        warned = false
        return
      } else if (array[0].warnedID !== userID) {
        sendResponse('This warning does not belong to the specified user.')
        warned = false
        return
      } else if (array[0].serverID !== serverID) {
        sendResponse('I may not be the sharpest tool in the shed, but I am no fool. ' +
        'This warning is not in the current server.')
        warned = false
        return
      }
      warningCollection.deleteMany({ _id: new ObjectID(getArguments(getArguments(message))) })
        .catch((err: string) => {
          sendResponse(`Something went wrong 👾 Error: ${err}`)
          warned = false
        })
    })
  // Respond.
  setTimeout(() => { if (warned) sendResponse(`**Warning has been deleted.**`) }, 2000)
}
