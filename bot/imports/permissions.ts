// Get types.
type client = { /* eslint-disable no-undef */
  servers: {
    [index: string]: {
      name: string,
      roles: { [index: string]: { [index: string]: {} } },
      members: { [index: string]: { roles: Array<string> } }
    }
  },
  users: {
    [index: string]: { userID: string, username: string, discriminator: string }
  },
} /* eslint-enable no-undef */

// Export function.
export default function checkUserForPermission (
  client: client, userID: string, serverID: string, perm: string
) {
  // Get roles of user.
  const rolesOfUser = client.servers[serverID].members[userID].roles
  // Get all roles in server.
  const rolesInServer = client.servers[serverID].roles
  // Iterate over roles.
  let userHasPermission = false
  for (let roleIndex in rolesOfUser) {
    if (userHasPermission) break
    // Obviously.
    if (rolesInServer[rolesOfUser[roleIndex]]['GENERAL_ADMINISTRATOR']) userHasPermission = true
    if (rolesInServer[rolesOfUser[roleIndex]][perm]) userHasPermission = true
  }
  return userHasPermission
}
