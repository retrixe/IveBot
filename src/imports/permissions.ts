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
  for (const role of rolesOfUser) {
    if (rolesInServer.get(role).position > highestRolePosition) {
      if (
        !considerMutedRole && rolesInServer.get(role).name === 'Muted'
      ) continue
      highestRolePosition = rolesInServer.find(e => role === e.id).position
    }
  }
  return highestRolePosition
}
