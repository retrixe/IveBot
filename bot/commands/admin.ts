import { getArguments, getIdFromMention } from '../imports/tools'
import { checkUserForPermission, checkRolePosition } from '../imports/permissions'
import * as ms from 'ms'
import { request } from 'graphql-request'
// Get types.
import { client, event, roleType } from '../imports/types'

// Add role.
export function handleAddrole (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Check for enough arguments.
  if (message.split(' ').length <= 1) return
  // Check for permissions.
  let allowed = false
  // Check user for permissions.
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_ROLES')) allowed = true
  else if (serverSettings.addRoleForAll) allowed = true
  if (!allowed) {
    sendResponse('Your server does not allow you to add roles.')
    return
  }
  // Check if add to another user.
  let possibleUser = getIdFromMention(getArguments(message).split(' ')[0])
  const possibleUser2 = getArguments(message).split(' ')[0]
  if (possibleUser2 in client.users) possibleUser = possibleUser2
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === possibleUser2.toLocaleLowerCase())
  ) possibleUser = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === possibleUser2.toLocaleLowerCase()).id
  if (possibleUser in client.users) {
    // Role name.
    const role = getArguments(getArguments(message))
    const roleID = Object.values(
      client.servers[client.channels[event.d.channel_id].guild_id].roles
    ).find(a => a.name === role).id
    // Respect role order.
    if (client.servers[client.channels[event.d.channel_id].guild_id].roles[roleID].position >
      checkRolePosition(client, possibleUser, client.channels[event.d.channel_id].guild_id)
    ) {
      sendResponse('You cannot have this role! People nowadays.')
      return
    }
    client.addToRole({
      serverID: client.channels[event.d.channel_id].guild_id,
      userID: possibleUser,
      roleID
    }, (err: string) => {
      if (err) sendResponse('Could not add role to user. Did you specify a role?')
      else sendResponse(`Added role ${role} to <@${possibleUser}>.`)
    })
    return
  }
  // Role name.
  const role = getArguments(getArguments(message))
  const roleID = Object.values(
    client.servers[client.channels[event.d.channel_id].guild_id].roles
  ).find(a => a.name === role).id
  // Respect role order.
  if (client.servers[client.channels[event.d.channel_id].guild_id].roles[roleID].position >
    checkRolePosition(client, possibleUser, client.channels[event.d.channel_id].guild_id)
  ) {
    sendResponse('You cannot have this role! People nowadays.')
    return
  }
  client.addToRole({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID: event.d.author.id,
    roleID
  }, (err: string) => {
    if (err) sendResponse('Could not add role to user. Did you specify a role?')
    else sendResponse(`Added you to role ${role}.`)
  })
}

// Remove role.
export function handleRemoverole (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Check for enough arguments.
  if (message.split(' ').length <= 1) return
  // Check for permissions.
  let allowed = false
  // Check user for permissions.
  if (checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_ROLES')) allowed = true
  else if (serverSettings.addRoleForAll) allowed = true
  if (!allowed) {
    sendResponse('Your server does not allow you to add roles.')
    return
  }
  // Respect role order.
  // Check if add to another user.
  let possibleUser = getIdFromMention(getArguments(message).split(' ')[0])
  const possibleUser2 = getArguments(message).split(' ')[0]
  if (possibleUser2 in client.users) possibleUser = possibleUser2
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === possibleUser2.toLocaleLowerCase())
  ) possibleUser = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === possibleUser2.toLocaleLowerCase()).id
  if (possibleUser in client.users) {
    // Role name.
    const role = getArguments(getArguments(message))
    client.removeFromRole({
      serverID: client.channels[event.d.channel_id].guild_id,
      userID: possibleUser,
      roleID: Object.values(
        client.servers[client.channels[event.d.channel_id].guild_id].roles
      ).find(a => a.name === role).id
    }, (err: string) => {
      if (err) sendResponse('Could not remove role from user. Did you specify a role?')
      else sendResponse(`Removed role ${role} from <@${possibleUser}>.`)
    })
    return
  }
  // Role name.
  const role = getArguments(getArguments(message))
  client.removeFromRole({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID: event.d.author.id,
    roleID: Object.values(
      client.servers[client.channels[event.d.channel_id].guild_id].roles
    ).find(a => a.name === role).id
  }, (err: string) => {
    if (err) sendResponse('Could not remove role from user. Did you specify a role?')
    else sendResponse(`Removed you from role ${role}.`)
  })
}

// Toggle public role system.
export async function handleTogglepublicroles (
  client: client, event: event, sendResponse: Function, message: string,
  serverSettings: { addRoleForAll: boolean }
) {
  // Can person manage server?
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_MANAGE_GUILD')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
    return
  }
  // Query.
  const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.
  // If no arguments..
  if (message.split(' ').length === 1) {
    // eslint-disable-next-line typescript/no-explicit-any
    await request(`http://localhost:${port}/graphql`, `
mutation {
  editServerSettings(serverId: "${client.channels[event.d.channel_id].guild_id}", addRoleForAll: ${!serverSettings.addRoleForAll}) {
    addRoleForAll
  }
}
    `)
    sendResponse(`Public role system set to ${!serverSettings.addRoleForAll}.`)
    if (!serverSettings.addRoleForAll) sendResponse(`Regular members may give themselves roles if the role is below their highest one.`)
  } else if (message.split(' ')[1] === 'on') {
    // eslint-disable-next-line typescript/no-explicit-any
    await request(`http://localhost:${port}/graphql`, `
mutation {
  editServerSettings(serverId: "${client.channels[event.d.channel_id].guild_id}", addRoleForAll: true) {
    addRoleForAll
  }
}
    `)
    sendResponse(`Public role system set to ${true}.
Regular members may now give themselves roles if the role is below their highest one.`)
  } else if (message.split(' ')[1] === 'off') {
    // eslint-disable-next-line typescript/no-explicit-any
    await request(`http://localhost:${port}/graphql`, `
mutation {
  editServerSettings(serverId: "${client.channels[event.d.channel_id].guild_id}", addRoleForAll: false) {
    addRoleForAll
  }
}
    `)
    sendResponse(`Public role system set to ${false}.`)
  } else {
    sendResponse('Proper usage: /togglepublicroles (on/off)')
  }
}

// Ban!
export function handleBan (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_BAN_MEMBERS')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
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
  // Get information about user.
  const user = client.users[userID]
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // and.. cut.
  let banned = true
  client.ban({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
      sendResponse('I can\'t ban that person.')
      banned = false
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been banned. **rip.**`)
  })
  // DM the poor user.
  setTimeout(() => {
    if (!banned) return
    if (getArguments(getArguments(message)).trim()) {
      client.sendMessage({
        to: userID,
        message: `You have been banned from ${serverName} for ${getArguments(getArguments(message))}.`
      })
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({ to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been banned for **${getArguments(getArguments(message))}**.`
        })
      }
    } else {
      client.sendMessage({ to: userID, message: `You have been banned from ${serverName}.` })
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been banned for not staying chill >:L `
        })
      }
    }
  }, 1000)
}

// Kick!
export function handleKick (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_KICK_MEMBERS')) {
    sendResponse('**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**')
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
  // Get information about user.
  const user = client.users[userID]
  const serverName = client.servers[client.channels[event.d.channel_id].guild_id].name
  // and.. cut.
  let kicked = true
  client.kick({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
      sendResponse('I can\'t kick that person.')
      kicked = false
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been kicked. **rip.**`)
  })
  // DM the poor user.
  setTimeout(() => {
    if (!kicked) return
    if (getArguments(getArguments(message)).trim()) {
      client.sendMessage({
        to: userID,
        message: `You have been kicked from ${serverName} for ${getArguments(getArguments(message))}.`
      })
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been kicked for **${getArguments(getArguments(message))}**.`
        })
      }
    } else {
      // WeChill
      if (client.channels[event.d.channel_id].guild_id === '402423671551164416') {
        client.sendMessage({
          to: '402437089557217290',
          message: `**${user.username}#${user.discriminator}** has been kicked for not staying chill >:L `
        })
      }
      client.sendMessage({ to: userID, message: `You have been kicked from ${serverName}.` })
    }
  }, 1000)
}

// Unban. Aw..
export function handleUnban (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'GENERAL_BAN_MEMBERS')) {
    sendResponse('You can\'t unban people.')
    return
  }
  // Get information about user.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  const user = client.users[userID]
  // Unban the person.
  client.unban({
    serverID: client.channels[event.d.channel_id].guild_id,
    userID
  }, (err: { statusMessage: string }) => {
    if (err) {
      sendResponse('Cannot unban that person. Did you specify a user?')
      return
    }
    // Send response.
    sendResponse(`**${user.username}#${user.discriminator}** has been unbanned.`)
  })
}

// Mute!
export function handleMute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('You can\'t mute people.')
    return
  }
  // userID.
  let userID = getIdFromMention(getArguments(message).split(' ')[0])
  const ifUserId = getArguments(message).split(' ')[0]
  if (ifUserId in client.users) userID = ifUserId
  else if (
    Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase())
  ) userID = Object.values(client.users).find(a => a.username.toLocaleLowerCase() === ifUserId.toLocaleLowerCase()).id
  // Find a Muted role.
  const roles = client.servers[client.channels[event.d.channel_id].guild_id].roles
  // Sorry for the any.. but no other way :|
  let role = Object.values(roles).find((role) => role.name === 'Muted' || role.name === 'MutedNub')
  // Check for appropriate permissions.
  let r = false
  // Edit permissions of role if needed.
  if (role.TEXT_SEND_MESSAGES || role.VOICE_SPEAK) {
    client.editRole({
      serverID: client.channels[event.d.channel_id].guild_id,
      roleID: role.id,
      name: 'Muted',
      permissions: { TEXT_SEND_MESSAGES: false, VOICE_SPEAK: false }
    }, (err: { statusMessage: string }) => {
      if (err) { sendResponse('I could not add proper permissions to the Muted role.'); r = true }
    })
    if (r) return
    // Mute person.
    client.addToRole({ serverID: client.channels[event.d.channel_id].guild_id, roleID: role.id, userID }, (err: {}) => {
      if (err) sendResponse('Could not mute that person. Did you specify a user?')
      else { sendResponse('Muted.') }
    })
    // If no role, make a Muted role.
  } else if (!role) {
    client.createRole(client.channels[event.d.channel_id].guild_id, (
      err: { statusMessage: string }, res: roleType
    ) => {
      if (err) { sendResponse('I could not find a Muted role and cannot create a new one.'); r = true; return }
      role = res
      client.editRole({
        serverID: client.channels[event.d.channel_id].guild_id,
        roleID: res.id,
        name: 'Muted',
        permissions: { TEXT_SEND_MESSAGES: false, VOICE_SPEAK: false }
      })
    })
    if (r) return
    // Mute person.
    client.addToRole({ serverID: client.channels[event.d.channel_id].guild_id, roleID: role.id, userID }, (
      err: { statusMessage: string }
    ) => {
      if (err) sendResponse('Could not mute that person. Did you specify a user?')
      else { sendResponse('Muted.') }
    })
  } else {
    // Mute person.
    client.addToRole({ serverID: client.channels[event.d.channel_id].guild_id, roleID: role.id, userID }, (
      err: { statusMessage: string }
    ) => {
      if (err) sendResponse('Could not mute that person. Did you specify a user?')
      else { sendResponse('Muted.') }
    })
  }
  // If time given, set timeout.
  if (getArguments(message).split(' ')[1]) {
    setTimeout(() => {
      client.removeFromRole({
        serverID: client.channels[event.d.channel_id].guild_id,
        roleID: role.id,
        userID
      })
    }, ms(getArguments(message).split(' ')[1]))
  }
}

// Unmute. Aw..
export function handleUnmute (client: client, event: event, sendResponse: Function, message: string) {
  // Check user for permissions.
  if (!checkUserForPermission(client, event.d.author.id, client.channels[event.d.channel_id].guild_id, 'TEXT_MANAGE_MESSAGES')) {
    sendResponse('You can\'t unmute people.')
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

  // All roles of user and server.
  const roles = client.servers[client.channels[event.d.channel_id].guild_id].members[userID].roles
  const rolesOfServer = client.servers[client.channels[event.d.channel_id].guild_id].roles
  // Iterate over the roles.
  for (let roleIndex in roles) {
    const name = rolesOfServer[roles[roleIndex]].name
    if (name === 'Muted' || name === 'MutedNub') {
      client.removeFromRole({
        serverID: client.channels[event.d.channel_id].guild_id,
        userID,
        roleID: roles[roleIndex]
      })
      sendResponse('Unmuted.')
      break
    }
  }
}

// Warn.
export function handleWarn (client: client, event: event, sendResponse: Function, message: string) {
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
  const serverID = client.channels[event.d.channel_id].guild_id
  const mutation = `
mutation {
  warn(warnedId: "${userID}", warnerId: "${event.d.author.id}", reason: "${reason}", serverId: "${serverID}") {
    date
  }
}
  `
  console.log(mutation)
  // Tell the database via our API about this.
  let warned = true
  const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.
  request(`http://localhost:${port}/graphql`, mutation)
    .catch((err: string) => {
      if (err) { sendResponse(`Something went wrong 👾 Error: ${err}`); warned = false }
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
  }, 1000)
}
