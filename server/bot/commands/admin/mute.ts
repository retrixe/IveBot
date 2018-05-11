import { getArguments, getIdFromMention } from '../../imports/tools'
import { checkRolePosition } from '../../imports/permissions'
import { Constants } from 'eris'
import * as ms from 'ms'
// Get types.
import { client, event } from '../../imports/types'

// Mute!
export function handleMute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!event.member.permission.has('manageMessages')) {
    sendResponse('You can\'t mute people.')
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
  if (!member) { sendResponse('Please specify a valid user.'); return }
  // Respect role order.
  if (checkRolePosition(member) >= checkRolePosition(event.member)) {
    sendResponse('You cannot mute this person! People nowadays.'); return
  }
  // Find a Muted role.
  const roles = event.member.guild.roles
  // Sorry for the any.. but no other way :|
  let role = roles.find((role) => role.name === 'Muted')
  // Edit permissions of role if needed.
  let hasPerms = false
  if (role) {
    event.member.guild.channels.forEach((a) => {
      if (hasPerms) return
      if (!a.permissionOverwrites.find(i => i.id === role.id)) hasPerms = true
      else if (
        a.permissionOverwrites.find(i => i.id === role.id).has('sendMessages') ||
        a.permissionOverwrites.find(i => i.id === role.id).has('addReactions') ||
        a.permissionOverwrites.find(i => i.id === role.id).has('voiceSpeak')
      ) hasPerms = true
    })
  }
  if (hasPerms && role) {
    event.member.guild.channels.forEach((a) => {
      if (a.type === 0) {
        client.editChannelPermission(
          a.id, role.id, 0,
          Constants.Permissions.sendMessages | Constants.Permissions.addReactions,
          'role'
        )
      } else if (a.type === 2) {
        client.editChannelPermission(a.id, role.id, 0, Constants.Permissions.voiceSpeak, 'role')
      } else if (a.type === 4) {
        client.editChannelPermission(
          a.id, role.id, 0,
          Constants.Permissions.sendMessages |
          Constants.Permissions.addReactions | Constants.Permissions.voiceSpeak,
          'role'
        )
      }
    })
    // Mute person.
    client.addGuildMemberRole(
      event.member.guild.id, userID, role.id, getArguments(getArguments(message))
    ).then(() => sendResponse('Muted.')).catch(() => sendResponse('Could not mute that person.'))
    // If no role, make a Muted role.
  } else if (!role) {
    client.createRole(
      event.member.guild.id, { name: 'Muted', color: 0xFF8973 }
    ).then((res) => {
      // Modify channel permissions.
      event.member.guild.channels.forEach((a) => {
        if (a.type === 0) {
          client.editChannelPermission(
            a.id, res.id, 0,
            Constants.Permissions.sendMessages | Constants.Permissions.addReactions,
            'role'
          )
        } else if (a.type === 2) {
          client.editChannelPermission(a.id, res.id, 0, Constants.Permissions.voiceSpeak, 'role')
        } else if (a.type === 4) {
          client.editChannelPermission(
            a.id, res.id, 0,
            Constants.Permissions.sendMessages |
            Constants.Permissions.addReactions | Constants.Permissions.voiceSpeak,
            'role'
          )
        }
      })
      // Then mute the person.
      client.addGuildMemberRole(
        event.member.guild.id, userID, res.id, getArguments(getArguments(message))
      ).then(() => sendResponse('Muted.')).catch(() => sendResponse('Could not mute that person.'))
    }).catch(() => sendResponse('I could not find a Muted role and cannot create a new one.'))
  } else {
    // Mute person.
    client.addGuildMemberRole(
      event.member.guild.id, userID, role.id, getArguments(getArguments(message))
    ).then(() => sendResponse('Muted.')).catch(() => sendResponse('Could not mute that person.'))
  }
  // If time given, set timeout.
  try {
    if (ms(getArguments(message).split(' ')[1])) {
      setTimeout(() => {
        client.removeGuildMemberRole(event.member.guild.id, userID, role.id)
      }, ms(getArguments(message).split(' ')[1]))
    }
  } catch (e) {}
}

// Unmute. Aw..
export function handleUnmute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!event.member.permission.has('manageMessages')) {
    sendResponse('You can\'t mute people.')
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
  if (!member) { sendResponse('Please specify a valid user.'); return }
  // Respect role order.
  if (checkRolePosition(member) >= checkRolePosition(event.member)) {
    sendResponse('You cannot unmute this person! People nowadays.'); return
  }
  // All roles of user and server.
  const roles = event.member.guild.members.find(i => i.id === userID).roles
  const rolesOfServer = event.member.guild.roles
  // Iterate over the roles.
  for (let roleIndex in roles) {
    const name = rolesOfServer.find(i => i.id === roles[roleIndex]).name
    if (name === 'Muted') {
      client.removeGuildMemberRole(
        event.member.guild.id, userID, roles[roleIndex], getArguments(getArguments(message))
      )
      sendResponse('Unmuted.')
      break
    }
  }
}
