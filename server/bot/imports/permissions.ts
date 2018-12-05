// Get types.
import { Member } from 'eris'

// Export function.
export function checkRolePosition ( // eslint-disable-next-line space-infix-ops
  member: Member, considerOwnership: boolean=true, considerMutedRole: boolean=true
) {
  // Get roles of user.
  const rolesOfUser = member.roles
  // Get all roles in server.
  const rolesInServer = member.guild.roles
  // Iterate over roles.
  let highestRolePosition = 0
  for (let roleIndex in rolesOfUser) {
    if (rolesInServer.find(e => rolesOfUser[roleIndex] === e.id).position > highestRolePosition) {
      if (
        !considerMutedRole &&
        rolesInServer.find(e => rolesOfUser[roleIndex] === e.id).name === 'Muted'
      ) return highestRolePosition
      highestRolePosition = rolesInServer.find(e => rolesOfUser[roleIndex] === e.id).position
    }
  }
  if (member.guild.ownerID === member.id && considerOwnership) highestRolePosition = 9999
  return highestRolePosition
}
