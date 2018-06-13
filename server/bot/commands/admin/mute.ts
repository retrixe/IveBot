import { IveBotCommand } from '../../imports/types'
import { checkRolePosition } from '../../imports/permissions'
import { getInsult, getUser } from '../../imports/tools'
import { Constants } from 'eris'
import * as ms from 'ms'

export const handleMute: IveBotCommand = (client) => ({
  name: 'mute',
  opts: {
    description: 'Mute someone.',
    fullDescription: 'Mute someone. Compatible with Dyno.',
    usage: '/mute <user by ID/username/mention> (time limit) (reason)',
    guildOnly: true,
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args) => {
    // Find the user ID.
    let user = getUser(message, args.shift())
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user), true, false) >=
      checkRolePosition(message.member, true, false)
    ) {
      return `You cannot mute this person, you ${getInsult()}.`
    }
    // Find a Muted role.
    const roles = message.member.guild.roles
    let role = roles.find((role) => role.name === 'Muted')
    // Edit permissions of role if needed.
    let hasPerms = false
    if (role) {
      // We check each channel if Muted can speak there.
      message.member.guild.channels.forEach((a) => {
        if (hasPerms) return // If there is a channel which let's Muted speak, we skip the rest.
        // If no such permission overwrite exists, then the user has permissions.
        if (!a.permissionOverwrites.find(i => i.id === role.id)) hasPerms = true
        else if ( // Or if a permission overwrite grants perms, then user has permissions.
          a.permissionOverwrites.find(i => i.id === role.id).has('sendMessages') ||
          a.permissionOverwrites.find(i => i.id === role.id).has('addReactions') ||
          a.permissionOverwrites.find(i => i.id === role.id).has('voiceSpeak')
        ) hasPerms = true
      })
    }
    if (hasPerms && role) {
      message.member.guild.channels.forEach((a) => {
        if (a.type === 0) {
          client.editChannelPermission(
            a.id, role.id, 0,
            Constants.Permissions.sendMessages | Constants.Permissions.addReactions,
            'role'
          )
        } else if (a.type === 2) {
          client.editChannelPermission(a.id, role.id, 0, Constants.Permissions.voiceSpeak, 'role')
        } else if (a.type === 4) {
          client.editChannelPermission(
            a.id, role.id, 0,
            Constants.Permissions.sendMessages |
            Constants.Permissions.addReactions | Constants.Permissions.voiceSpeak,
            'role'
          )
        }
      })
      // Mute person.
      try {
        client.addGuildMemberRole(message.member.guild.id, user.id, role.id, args.join(' '))
      } catch (e) { return 'Could not mute that person.' }
      // If time given, set timeout.
      try {
        if (ms(args[1])) {
          setTimeout(() => {
            client.removeGuildMemberRole(message.member.guild.id, user.id, role.id)
          }, ms(args[1]))
        }
      } catch (e) { }
      return 'Muted.'
      // If no role, make a Muted role.
    } else if (!role) {
      try {
        role = await client.createRole(message.member.guild.id, { name: 'Muted', color: 0x444444 })
      } catch (e) { return 'I could not find a Muted role and cannot create a new one.' }
      // Modify channel permissions.
      message.member.guild.channels.forEach((a) => {
        if (a.type === 0) {
          client.editChannelPermission(
            a.id, role.id, 0,
            Constants.Permissions.sendMessages | Constants.Permissions.addReactions,
            'role'
          )
        } else if (a.type === 2) {
          client.editChannelPermission(a.id, role.id, 0, Constants.Permissions.voiceSpeak, 'role')
        } else if (a.type === 4) {
          client.editChannelPermission(
            a.id, role.id, 0,
            Constants.Permissions.sendMessages |
            Constants.Permissions.addReactions | Constants.Permissions.voiceSpeak,
            'role'
          )
        }
      })
      // Then mute the person.
      try {
        client.addGuildMemberRole(message.member.guild.id, user.id, role.id, args.join(' '))
      } catch (e) { return 'Could not mute that person.' }
      // If time given, set timeout.
      try {
        if (ms(args[1])) {
          setTimeout(() => {
            client.removeGuildMemberRole(message.member.guild.id, user.id, role.id)
          }, ms(args[1]))
        }
      } catch (e) { }
      return 'Muted.'
    } else {
      // Mute person.
      try {
        client.addGuildMemberRole(message.member.guild.id, user.id, role.id, args.join(' '))
      } catch (e) { return 'Could not mute that person.' }
      // If time given, set timeout.
      try {
        if (ms(args[1])) {
          setTimeout(() => {
            client.removeGuildMemberRole(message.member.guild.id, user.id, role.id)
          }, ms(args[1]))
        }
      } catch (e) {}
      return 'Muted.'
    }
  }
})

export const handleUnmute: IveBotCommand = (client) => ({
  name: 'unmute',
  opts: {
    description: 'Unmute someone.',
    fullDescription: 'Unmute someone. Compatible with Dyno.',
    usage: '/unmute <user by ID/username/mention> (reason)',
    guildOnly: true,
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: (message, args) => {
    // Find the user ID.
    let user = getUser(message, args[0])
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user), true, false) >=
      checkRolePosition(message.member, true, false)
    ) {
      return `You cannot mute this person, you ${getInsult()}.`
    }
    // All roles of user.
    const roles = message.member.guild.members.find(i => i.id === user.id).roles
    const rolesOfServer = message.member.guild.roles
    // Iterate over the roles.
    for (let roleIndex in roles) {
      if (rolesOfServer.find(i => i.id === roles[roleIndex]).name === 'Muted') {
        client.removeGuildMemberRole(
          message.member.guild.id, user.id, roles[roleIndex], args.join(' ')
        )
        return 'Unmuted.'
      }
    }
    return `That person is not muted, you ${getInsult()}.`
  }
})
