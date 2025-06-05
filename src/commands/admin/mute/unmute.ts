import type { Command } from '../../../imports/types.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'
import { getInsult, getUser } from '../../../imports/tools.ts'

export const handleUnmute: Command = {
  name: 'unmute',
  opts: {
    description: 'Unmute someone.',
    fullDescription: 'Unmute someone. Compatible with Dyno.',
    usage: '/unmute <user by ID/username/mention> (reason)',
    guildOnly: true,
    example: '/unmute voldemort wrong person',
    requirements: { permissions: { manageMessages: true } },
  },
  generator: async (message, args, { client, tempDB }) => {
    // Find the user ID.
    const user = getUser(message, args.shift())
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.get(user.id), true, false) >=
      checkRolePosition(message.member, true, false)
    ) {
      return { content: `You cannot mute this person, you ${getInsult()}.`, error: true }
    }
    // All roles of user.
    const roles = message.member.guild.members.get(user.id).roles
    const rolesOfServer = message.member.guild.roles
    const guildID = message.member.guild.id
    // Iterate over the roles.
    for (const role of roles) {
      if (rolesOfServer.get(role).name === 'Muted') {
        // Remove the mute persist.
        if (tempDB.mute[guildID]?.includes(user.id)) {
          tempDB.mute[guildID].splice(
            tempDB.mute[guildID].findIndex(i => i === user.id),
            1,
          )
        }
        // Take the role.
        await client.removeGuildMemberRole(message.member.guild.id, user.id, role, args.join(' '))
        return 'Unmuted.'
      }
    }
    return { content: `That person is not muted, you ${getInsult()}.`, error: true }
  },
}
