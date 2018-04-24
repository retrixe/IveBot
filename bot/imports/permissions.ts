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
export function checkRolePosition (client: client, userID: string, serverID: string) {
  // Get roles of user.
  const rolesOfUser = client.servers[serverID].members[userID].roles
  // Get all roles in server.
  const rolesInServer = client.servers[serverID].roles
  // Iterate over roles.
  let highestRolePosition = 0
  for (let roleIndex in rolesOfUser) {
    if (rolesInServer[rolesOfUser[roleIndex]].position > highestRolePosition) {
      highestRolePosition = rolesInServer[rolesOfUser[roleIndex]].position
    }
  }
  return highestRolePosition
}
