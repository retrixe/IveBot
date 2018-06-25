import { getArguments, getIdFromMention } from '../imports/tools'
import { checkRolePosition } from '../imports/permissions'
// Get types.
import { client, event, mongoDB } from '../imports/types'
import { ObjectID } from 'mongodb'

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
