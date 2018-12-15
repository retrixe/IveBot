import { Command } from '../../imports/types'
import { checkRolePosition } from '../../imports/permissions'
import { getInsult, getUser, getServerSettings } from '../../imports/tools'

export const handleGiverole: Command = {
  name: 'giverole',
  aliases: ['gr'],
  opts: {
    description: 'Give role to yourself/user.',
    fullDescription: 'Give role to yourself/user. Manager/Mod only unless Public Roles are on.',
    usage: '/giverole (user) <role by name/ID>',
    example: '/giverole @voldemort#6931 Helper',
    guildOnly: true
  },
  generator: async (message, args, { db, client }) => {
    // Check user for permissions.
    const insult = `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
    const publicRoles = (await getServerSettings(db, message.member.guild.id)).addRoleForAll
    if (!message.member.permission.has('manageRoles') && !publicRoles) return insult
    // Now find the user ID.
    let user = getUser(message, args[0])
    if (!message.member.permission.has('manageRoles') && user) return insult // Permission check.
    else if (!user) user = message.author
    else args.shift()
    // Now find the role.
    let role = message.member.guild.roles.find(
      a => a.name.toLowerCase() === args.join(' ').toLowerCase() || args.join(' ') === a.id
    )
    if (!role) return 'You have provided an invalid role name/ID, you ' + getInsult() + '.'
    else if (!publicRoles.split('|').includes(role.name)) return insult // Permission check.
    // Can the user manage this role?
    if (role.position >= checkRolePosition(message.member)
    ) return `You cannot give this role. Pfft, overestimating their own powers now.`
    // Give the role.
    const rolesOfMember = user.id !== message.author.id // Ternary statement.
      ? message.member.guild.members.find(a => a.id === user.id).roles
      : message.member.roles
    if (rolesOfMember.includes(role.id)) {
      return user.id === message.author.id // Ternary statement.
        ? `You ${getInsult()}, you already have the specified role.`
        : `You ${getInsult()}, that person already has the specified role.`
    }
    try {
      await client.addGuildMemberRole(
        message.member.guild.id, user.id, role.id, 'Give role command called.'
      )
    } catch (e) {
      return user.id === message.author.id // Ternary statement.
        ? 'Could not give you the role.' : 'Could not give role to user.'
    }
    return user.id === message.author.id // Ternary statement.
      ? `Gave you the role **${role.name}**.` : `Gave role **${role.name}** to ${user.mention}.`
  }
}

export const handleTakerole: Command = {
  name: 'takerole',
  aliases: ['tr'],
  opts: {
    description: 'Take role from yourself/user.',
    fullDescription: 'Take role from yourself/user. Manager/Mod only unless Public Roles are on.',
    usage: '/takerole (user) <role by name/ID>',
    example: '/takerole @voldemort#6931 Helper',
    guildOnly: true
  },
  generator: async (message, args, { db, client }) => {
    // Check user for permissions.
    const insult = `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
    const publicRoles = (await getServerSettings(db, message.member.guild.id)).addRoleForAll
    if (!message.member.permission.has('manageRoles') && !publicRoles) return insult
    // Now find the user ID.
    let user = getUser(message, args[0])
    if (!message.member.permission.has('manageRoles') && user) return insult // Permission check.
    else if (!user) user = message.author
    else args.shift()
    // Now find the role.
    let role = message.member.guild.roles.find(
      a => a.name.toLowerCase() === args.join(' ').toLowerCase() || args.join(' ') === a.id
    )
    if (!role) return 'You have provided an invalid role name/ID, you ' + getInsult() + '.'
    else if (!publicRoles.split('|').includes(role.name)) return insult // Permission check.
    // Can the user manage this role?
    if (role.position >= checkRolePosition(message.member)
    ) return `You cannot take this role. Pfft, overestimating their own powers now.`
    // Give the role.
    const rolesOfMember = user.id !== message.author.id // Ternary statement.
      ? message.member.guild.members.find(a => a.id === user.id).roles
      : message.member.roles
    if (!rolesOfMember.includes(role.id)) {
      return user.id === message.author.id // Ternary statement.
        ? `You ${getInsult()}, you don't have the specified role.`
        : `You ${getInsult()}, that person doesn't have the specified role.`
    }
    try {
      await client.removeGuildMemberRole(
        message.member.guild.id, user.id, role.id, 'Take role command called.'
      )
    } catch (e) {
      return user.id === message.author.id // Ternary statement.
        ? 'Could not take the role from you.' : 'Could not take role from the user.'
    }
    return user.id === message.author.id // Ternary statement.
      ? `Took the role **${role.name}** from you.` : `Took role **${role.name}** from ${user.mention}.`
  }
}
