import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'
// Get types.
import { client, event } from '../../imports/types'

// Give role.
export function handleGiverole (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Check for enough arguments.
  if (message.split(' ').length <= 1) return
  // Check for permissions.
  let allowed = false
  // Check user for permissions.
  if (event.member.permission.has('manageRoles')) allowed = true
  else if (serverSettings.addRoleForAll) allowed = true
  if (!allowed) {
    sendResponse('Your server does not allow you to give roles.')
    return
  }
  // Check if add to another user.
  let possibleUser = getIdFromMention(getArguments(message).split(' ')[0])
  const possibleUser2 = getArguments(message).split(' ')[0]
  if (event.member.guild.members.find(i => i.id === possibleUser2)) possibleUser = possibleUser2
  else if (
    event.member.guild.members.find(a => a.username.toLowerCase() === possibleUser2.toLowerCase())
  ) possibleUser = event.member.guild.members.find(a => a.username.toLowerCase() === possibleUser2.toLowerCase()).id
  // Role name.
  const role = getArguments(getArguments(message))
  let roleID: string
  try {
    roleID = event.member.guild.roles.find(r => r.id === role) ? role
      : event.member.guild.roles.find(a => a.name.toLowerCase() === role.toLowerCase()).id
  } catch (e) { sendResponse('You have provided an invalid role name/ID, pfft.'); return }
  // Respect role order.
  if (
    event.member.guild.roles.find(i => i.id === roleID).position > checkRolePosition(event.member)
  ) {
    sendResponse('You cannot give this role! People nowadays.')
    return
  }
  if (event.member.guild.members.find(i => i.id === possibleUser)) {
    if (event.member.guild.members.find(i => i.id === possibleUser).roles.includes(roleID)) {
      sendResponse('You pathetic person, that person already has the specified role.')
      return
    }
    client.addGuildMemberRole(event.member.guild.id, possibleUser, roleID).then(() => {
      sendResponse(`Gave role ${role} to <@${possibleUser}>.`)
    }).catch(() => sendResponse('Could not give role to user.'))
    return
  }
  if (event.member.roles.includes(roleID)) {
    sendResponse('You pathetic person, you already have the specified role.')
    return
  }
  client.addGuildMemberRole(event.member.guild.id, event.author.id, roleID).then(() => {
    sendResponse(`Gave you the role ${role}.`)
  }).catch(() => sendResponse('Could not give role to you.'))
}

// Take role.
export function handleTakerole (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Check for enough arguments.
  if (message.split(' ').length <= 1) return
  // Check for permissions.
  let allowed = false
  // Check user for permissions.
  if (event.member.permission.has('manageRoles')) allowed = true
  else if (serverSettings.addRoleForAll) allowed = true
  if (!allowed) {
    sendResponse('Your server does not allow you to take roles.')
    return
  }
  // Check if add to another user.
  let possibleUser = getIdFromMention(getArguments(message).split(' ')[0])
  const possibleUser2 = getArguments(message).split(' ')[0]
  if (event.member.guild.members.find(i => i.id === possibleUser2)) possibleUser = possibleUser2
  else if (
    event.member.guild.members.find(a => a.username.toLowerCase() === possibleUser2.toLowerCase())
  ) possibleUser = event.member.guild.members.find(a => a.username.toLowerCase() === possibleUser2.toLowerCase()).id
  // Role name.
  const role = getArguments(getArguments(message))
  let roleID: string
  try {
    roleID = event.member.guild.roles.find(r => r.id === role) ? role
      : event.member.guild.roles.find(a => a.name.toLowerCase() === role.toLowerCase()).id
  } catch (e) { sendResponse('You have provided an invalid role name/ID, pfft.'); return }
  // Respect role order.
  if (
    event.member.guild.roles.find(i => i.id === roleID).position > checkRolePosition(event.member)
  ) {
    sendResponse('You cannot take this role! People nowadays.')
    return
  }
  if (event.member.guild.members.find(i => i.id === possibleUser)) {
    if (event.member.guild.members.find(i => i.id === possibleUser).roles.includes(roleID)) {
      sendResponse('You pathetic person, that person does not have the specified role.')
      return
    }
    client.addGuildMemberRole(event.member.guild.id, possibleUser, roleID).then(() => {
      sendResponse(`Took role ${role} from <@${possibleUser}>.`)
    }).catch(() => sendResponse('Could not take role from user.'))
    return
  }
  if (!event.member.roles.includes(roleID)) {
    sendResponse('You pathetic person, you do not have the specified role.')
    return
  }
  client.addGuildMemberRole(event.member.guild.id, event.author.id, roleID).then(() => {
    sendResponse(`Took role ${role} from you.`)
  }).catch(() => sendResponse('Could not take role from you.'))
}
