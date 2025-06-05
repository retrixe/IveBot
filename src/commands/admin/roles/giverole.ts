import type { Command } from '../../../imports/types.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'
import { getInsult, getUser, getServerSettings } from '../../../imports/tools.ts'

export const handleGiverole: Command = {
  name: 'giverole',
  aliases: ['gr'],
  opts: {
    description: 'Give role to yourself/user.',
    fullDescription: 'Give role to yourself/user. Manager/Mod only unless Public Roles are on.',
    usage: '/giverole (user) <role by name/ID>',
    example: '/giverole @voldemort#6931 Helper',
    guildOnly: true,
  },
  generator: async (message, args, { db, client }) => {
    const manageRoles = message.member.permissions.has('manageRoles')
    // Check user for permissions.
    const insult = `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
    const publicRoles = (await getServerSettings(db, message.member.guild.id)).publicRoles || ''
    if (!manageRoles && !publicRoles) return insult
    // Now find the user ID.
    let user = getUser(message, args[0])
    if (!user) user = message.author
    else if (user && !manageRoles)
      return insult // Permission check.
    else args.shift()
    // Now find the role.
    const role = message.member.guild.roles.find(
      a => a.name.toLowerCase() === args.join(' ').toLowerCase() || args.join(' ') === a.id,
    )
    const isPublicRole = role && publicRoles.split('|').includes(role.name)
    if (!role)
      return {
        content: 'You have provided an invalid role name/ID, you ' + getInsult() + '.',
        error: true,
      }
    else if (!isPublicRole && !manageRoles) return insult
    // Can the user manage this role?
    else if (role.position >= checkRolePosition(message.member) && !isPublicRole)
      return {
        content: 'You cannot give this role. Pfft, overestimating their own powers now.',
        error: true,
      }
    // Can the bot manage this role?
    else if (
      role.position >= checkRolePosition(message.member.guild.members.get(client.user.id)) ||
      !message.member.guild.members.get(client.user.id).permissions.has('manageRoles')
    )
      return { content: `I lack permissions to give this role, you ${getInsult()}.`, error: true }
    // Give the role.
    const rolesOfMember =
      user.id !== message.author.id // Ternary statement.
        ? message.member.guild.members.get(user.id).roles
        : message.member.roles
    if (rolesOfMember.includes(role.id)) {
      return {
        content:
          user.id === message.author.id // Ternary statement.
            ? `You ${getInsult()}, you already have the specified role.`
            : `You ${getInsult()}, that person already has the specified role.`,
        error: true,
      }
    }
    try {
      await client.addGuildMemberRole(
        message.member.guild.id,
        user.id,
        role.id,
        'Give role command called.',
      )
    } catch {
      return user.id === message.author.id // Ternary statement.
        ? 'Could not give you the role.'
        : 'Could not give role to user.'
    }
    return user.id === message.author.id // Ternary statement.
      ? `Gave you the role **${role.name}**.`
      : `Gave role **${role.name}** to ${user.mention}.`
  },
}
