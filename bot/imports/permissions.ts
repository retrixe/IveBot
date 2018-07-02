// Get types.
type client = { /* eslint-disable no-undef */
  servers: {
    [index: string]: {
      name: string,
      roles: { [index: string]: { position: number, [index: string]: {} } },
      members: { [index: string]: { roles: Array<string> } },
      owner_id: string // eslint-disable-line camelcase
    }
  },
  channels: {
    [index: string]: {
      guild_id: string, permissions: { // eslint-disable-line camelcase
      role: {
        [index: string]: { allow: number, deny: number }
      },
      user: {
        [index: string]: { allow: number, deny: number }
      }
    } }
  },
  users: {
    [index: string]: { id: string, username: string, discriminator: string }
  },
} /* eslint-enable no-undef */

// Export function.
export function checkUserForPermission (
  client: client, userID: string, serverID: string, perm: string
) {
  // Get roles of user.
  const rolesOfUser = client.servers[serverID].members[userID].roles
  // Get all roles in server.
  const rolesInServer = client.servers[serverID].roles
  // Iterate over roles.
  let userHasPermission = false
  if (client.servers[serverID].owner_id === userID) userHasPermission = true
  for (let roleIndex in rolesOfUser) {
    if (userHasPermission) break
    // Obviously.
    if (rolesInServer[rolesOfUser[roleIndex]]['GENERAL_ADMINISTRATOR']) userHasPermission = true
    if (rolesInServer[rolesOfUser[roleIndex]][perm]) userHasPermission = true
  }
  return userHasPermission
}

// Export function.
// eslint-disable-next-line space-infix-ops
export function checkRolePosition (client: client, userID: string, serverID: string, considerOwnership: boolean=true, considerMutedRole: boolean=true) {
  // Get roles of user.
  const rolesOfUser = client.servers[serverID].members[userID].roles
  // Get all roles in server.
  const rolesInServer = client.servers[serverID].roles
  // Iterate over roles.
  let highestRolePosition = 0
  for (let roleIndex in rolesOfUser) {
    if (
      rolesInServer[rolesOfUser[roleIndex]].position > highestRolePosition &&
      !(rolesInServer[rolesOfUser[roleIndex]].name === 'Muted' && !considerMutedRole)
    ) {
      highestRolePosition = rolesInServer[rolesOfUser[roleIndex]].position
    }
  }
  if (client.servers[serverID].owner_id === userID && considerOwnership) highestRolePosition = 9999
  return highestRolePosition
}

export function checkChannelPermission (
  client: client, userID: string, channelID: string, permission: number
) {
  let channel = client.channels[channelID]
  if (client.servers[channel.guild_id].owner_id === userID) return true
  // eslint-disable-next-line typescript/no-explicit-any
  let roles: any = client.servers[channel.guild_id].roles
  let member = client.servers[channel.guild_id].members[userID]
  if (member.roles.some(r => roles[r].GENERAL_ADMINISTRATOR)) return true

  let overwrites = [
    { allow: member.roles.concat([channel.guild_id]).reduce((acc, val) => roles[val]._permissions | acc, 0), deny: 0 },
    channel.permissions['role'][channel.guild_id],
    member.roles.filter(r => channel.permissions['role'][r]).map(r => channel.permissions['role'][r]).reduce((acc, val) => {
      return { allow: acc.allow | val.allow, deny: acc.deny | val.deny }
    }, { allow: 0, deny: 0 }),
    channel.permissions['user'][userID] || { allow: 0, deny: 0 }
  ]

  let effective = 0 // effective perms
  overwrites.forEach(ov => {
    effective &= ~ov.deny
    effective |= ov.allow
  })

  return ((effective >> permission) & 1) === 1
}
