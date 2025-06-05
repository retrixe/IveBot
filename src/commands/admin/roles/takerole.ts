import type { Command } from '../../../imports/types.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'
import { getInsult, getUser, getServerSettings } from '../../../imports/tools.ts'

export const handleTakerole: Command = {
  name: 'takerole',
  aliases: ['tr'],
  opts: {
    description: 'Take role from yourself/user.',
    fullDescription: 'Take role from yourself/user. Manager/Mod only unless Public Roles are on.',
    usage: '/takerole (user) <role by name/ID>',
    example: '/takerole @voldemort#6931 Helper',
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
    else if (!manageRoles && user)
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
        content: 'You cannot take this role. Pfft, overestimating their own powers now.',
        error: true,
      }
    // Can the bot manage this role?
    else if (
      role.position >= checkRolePosition(message.member.guild.members.get(client.user.id)) ||
      !message.member.guild.members.get(client.user.id).permissions.has('manageRoles')
    )
      return { content: `I lack permissions to take this role, you ${getInsult()}.`, error: true }
    // Give the role.
    const rolesOfMember =
      user.id !== message.author.id // Ternary statement.
        ? message.member.guild.members.get(user.id).roles
        : message.member.roles
    if (!rolesOfMember.includes(role.id)) {
      return {
        content:
          user.id === message.author.id // Ternary statement.
            ? `You ${getInsult()}, you don't have the specified role.`
            : `You ${getInsult()}, that person doesn't have the specified role.`,
        error: true,
      }
    }
    try {
      await client.removeGuildMemberRole(
        message.member.guild.id,
        user.id,
        role.id,
        'Take role command called.',
      )
    } catch (e) {
      return user.id === message.author.id // Ternary statement.
        ? 'Could not take the role from you.'
        : 'Could not take role from the user.'
    }
    return user.id === message.author.id // Ternary statement.
      ? `Took the role **${role.name}** from you.`
      : `Took role **${role.name}** from ${user.mention}.`
  },
}
