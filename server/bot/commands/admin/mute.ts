import { Command } from '../../imports/types'
import { checkRolePosition } from '../../imports/permissions'
import { getInsult, getUser } from '../../imports/tools'
import { Constants } from 'eris'
import ms from 'ms'

export const handleMute: Command = {
  name: 'mute',
  aliases: ['shutup', 'oppress'],
  opts: {
    description: 'Mute someone.',
    fullDescription: 'Mute someone. Compatible with Dyno.',
    usage: '/mute <user by ID/username/mention> (time limit) (reason)',
    example: '/mute voldemort 1h bored',
    guildOnly: true,
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: async (message, args, { client, tempDB, db }) => {
    // Find the user ID.
    let user = getUser(message, args.shift())
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.find(i => i.user === user), true, false) >=
      checkRolePosition(message.member, true, false)
    ) return `You cannot mute this person, you ${getInsult()}.`

    // Find a Muted role.
    let role = message.member.guild.roles.find((role) => role.name === 'Muted')
    // Edit permissions of role if needed.
    let hasPerms = false
    if (role) {
      // We check each channel if Muted can speak there.
      message.member.guild.channels.forEach((a) => {
        if (hasPerms) return // If there is a channel which let's Muted speak, we skip the rest.
        // If no such permission overwrite exists, then the user has permissions.
        if (!a.permissionOverwrites.get(role.id)) hasPerms = true
        else if ( // Or if a permission overwrite grants perms, then user has permissions.
          a.permissionOverwrites.get(role.id).has('sendMessages') ||
          a.permissionOverwrites.get(role.id).has('addReactions') ||
          a.permissionOverwrites.get(role.id).has('voiceSpeak')
        ) hasPerms = true
      })
    // If the role doesn't exist, we create one.
    } else if (!role) {
      try {
        role = await client.createRole(message.member.guild.id, { name: 'Muted', color: 0x444444 })
        hasPerms = true
      } catch (e) { return 'I could not find a Muted role and cannot create a new one.' }
    }
    // Set permissions as required.
    if (hasPerms && role) {
      try {
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
      } catch (e) { return 'I cannot set permissions for the Muted role.' }
    }
    // Can the bot manage this role?
    if (
      role.position >= checkRolePosition(message.member.guild.members.get(client.user.id)) ||
      !message.member.guild.members.get(client.user.id).permission.has('manageRoles')
    ) return `I lack permissions to mute people with the role, you ${getInsult()}.`
    // Mute person.
    try {
      await client.addGuildMemberRole(message.member.guild.id, user.id, role.id, args.join(' '))
    } catch (e) { return 'Could not mute that person.' }
    // Persist the mute.
    const guildID = message.member.guild.id
    // If time given, set timeout to remove role in database.
    try {
      // Figure out the time for which the user is muted.
      let time = 0
      try { time = ms(args[0]) || 0 } catch (e) { }
      if (time && time >= 2073600000) return 'Mute limit is 24 days.'
      const mute = await db.collection('tasks').findOne({ type: 'unmute', guild: guildID, user: user.id })
      if (!mute && time > 0) {
        // Insert the persisted mute.
        await db.collection('tasks').insertOne({
          type: 'unmute', guild: guildID, user: user.id, target: role.id, time: time + Date.now()
        })
        // If this was modifying a previous mute.
      } else if (mute && time > 0) {
        await db.collection('tasks').updateOne({ type: 'unmute', guild: guildID, user: user.id }, {
          $set: { time: time + Date.now() }
        })
      }
    } catch (e) { return 'Failed to add mute timer! However, user has been muted.' }
    // Persist in cache.
    if (!tempDB.mute[guildID]) tempDB.mute[guildID] = [user.id]
    else if (!tempDB.mute[guildID].includes(user.id)) tempDB.mute[guildID].push(user.id)
    /*
    try {
      if (ms(args[0]) && ms(args[0]) >= 2073600000) return 'Mute limit is 24 days.'
      else if (ms(args[0])) {
        setTimeout(async () => {
          try {
            // Remove the mute persist.
            tempDB.mute[guildID].splice(tempDB.mute[guildID].findIndex((i) => i === user.id), 1)
            // Take the role.
            await client.removeGuildMemberRole(message.member.guild.id, user.id, role.id)
          } catch (e) { message.channel.createMessage('Unable to unmute user.') }
        }, ms(args[0]))
      }
    } catch (e) {}
    */
    return 'Muted.'
  }
}

export const handleUnmute: Command = {
  name: 'unmute',
  opts: {
    description: 'Unmute someone.',
    fullDescription: 'Unmute someone. Compatible with Dyno.',
    usage: '/unmute <user by ID/username/mention> (reason)',
    guildOnly: true,
    example: '/unmute voldemort wrong person',
    requirements: { permissions: { 'manageMessages': true } }
  },
  generator: (message, args, { client, tempDB }) => {
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
    // All roles of user.
    const roles = message.member.guild.members.get(user.id).roles
    const rolesOfServer = message.member.guild.roles
    const guildID = message.member.guild.id
    // Iterate over the roles.
    for (let roleIndex in roles) {
      if (rolesOfServer.get(roles[roleIndex]).name === 'Muted') {
        // Remove the mute persist.
        if (tempDB.mute[guildID] && tempDB.mute[guildID].includes(user.id)) {
          tempDB.mute[guildID].splice(tempDB.mute[guildID].findIndex((i) => i === user.id), 1)
        }
        // Take the role.
        client.removeGuildMemberRole(
          message.member.guild.id, user.id, roles[roleIndex], args.join(' ')
        )
        return 'Unmuted.'
      }
    }
    return `That person is not muted, you ${getInsult()}.`
  }
}
