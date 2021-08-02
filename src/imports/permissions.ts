// Get types.
import { Member } from 'eris'

// Export function.
export function checkRolePosition (
  member: Member, considerOwnership: boolean = true, considerMutedRole: boolean = true
): number {
  // If owner, return.
  if (member.guild.ownerID === member.id && considerOwnership) return 9999
  // Get roles of user.
  const rolesOfUser = member.roles
  // Get all roles in server.
  const rolesInServer = member.guild.roles
  // Iterate over roles.
  let highestRolePosition = 0
  for (const roleId of rolesOfUser) {
    const role = rolesInServer.get(roleId)
    if (role && role.position > highestRolePosition) {
      if (
        !considerMutedRole && role.name === 'Muted'
      ) continue
      highestRolePosition = role.position
    }
  }
  return highestRolePosition
}
