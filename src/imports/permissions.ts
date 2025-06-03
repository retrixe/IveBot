// Get types.
import type { Member } from '@projectdysnomia/dysnomia'

// Export function.
export function checkRolePosition(
  member: Member,
  considerOwnership = true,
  considerMutedRole = true,
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
      if (!considerMutedRole && role.name === 'Muted') continue
      highestRolePosition = role.position
    }
  }
  return highestRolePosition
}

export function formatPermissionName(name: string): string {
  return (name.substr(0, 1).toUpperCase() + name.substr(1))
    .replace(/[A-Z]+/g, s => ' ' + s)
    .replace('TTSMessages', 'TTS Messages')
}
