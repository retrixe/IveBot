import type { Command } from '../../../imports/types.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'
import { getInsult } from '../../../imports/tools.ts'

export const handleNotify: Command = {
  name: 'notify',
  opts: {
    description: 'Ping a role which cannot be mentioned.',
    fullDescription: 'Ping a role which cannot be mentioned.',
    usage: '/notify <role by name/ID> (message)',
    example: '/notify Helper testing',
    guildOnly: true,
    deleteCommand: true,
    requirements: { permissions: { manageRoles: true } },
  },
  generator: async (message, args, { client }) => {
    // Find the role.
    const arg = args.shift()
    const role = message.member.guild.roles.find(
      a => arg === a.id || a.name.toLowerCase() === arg.toLowerCase() || arg === a.mention,
    )
    if (!role)
      return {
        content: `You have provided an invalid role name/ID, you ${getInsult()}.`,
        error: true,
      }
    // Can the user manage this role?
    if (role.position >= checkRolePosition(message.member) && !role.mentionable)
      return { content: `You cannot notify this role, you ${getInsult()}.`, error: true }
    // Can the bot manage this role?
    if (
      (role.position >= checkRolePosition(message.member.guild.members.get(client.user.id)) ||
        !message.member.guild.members.get(client.user.id).permissions.has('manageRoles')) &&
      !role.mentionable
    )
      return { content: `I cannot notify this role, you ${getInsult()}.`, error: true }
    // Edit the role.
    const wasMentionable = role.mentionable
    if (!wasMentionable) await role.edit({ mentionable: true })
    await message.channel.createMessage(`${role.mention} ${args.join(' ')}`)
    if (!wasMentionable) await role.edit({ mentionable: false })
  },
}
