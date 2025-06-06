import type { Command } from '../../../imports/types.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'
import { getInsult, getUser } from '../../../imports/tools.ts'
import { Constants } from '@projectdysnomia/dysnomia'
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
    requirements: { permissions: { manageMessages: true } },
  },
  generator: async (message, args, { client, tempDB, db }) => {
    // Find the user ID.
    const user = getUser(message, args.shift())
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.get(user.id), true, false) >=
      checkRolePosition(message.member, true, false)
    )
      return { content: `You cannot mute this person, you ${getInsult()}.`, error: true }

    // Find a Muted role.
    let role = message.member.guild.roles.find(role => role.name === 'Muted')
    // Edit permissions of role if needed.
    let hasPerms = false
    if (role) {
      // We check each channel if Muted can speak there.
      message.member.guild.channels.forEach(a => {
        if (hasPerms) return // If there is a channel which let's Muted speak, we skip the rest.
        // If no such permission overwrite exists, then the user has permissions.
        if (!a.permissionOverwrites.get(role.id)) hasPerms = true
        else if (
          // Or if a permission overwrite grants perms, then user has permissions.
          a.permissionOverwrites.get(role.id).has('sendMessages') ||
          a.permissionOverwrites.get(role.id).has('addReactions') ||
          a.permissionOverwrites.get(role.id).has('voiceSpeak') ||
          a.permissionOverwrites.get(role.id).has('useApplicationCommands') ||
          a.permissionOverwrites.get(role.id).has('sendMessagesInThreads') ||
          a.permissionOverwrites.get(role.id).has('createPrivateThreads') ||
          a.permissionOverwrites.get(role.id).has('createPublicThreads')
        )
          hasPerms = true
      })
      // If the role doesn't exist, we create one.
    } else if (!role) {
      try {
        role = await client.createRole(message.member.guild.id, { name: 'Muted', color: 0x444444 })
        hasPerms = true
      } catch {
        return 'I could not find a Muted role and cannot create a new one.'
      }
    }
    // Set permissions as required.
    if (hasPerms && role) {
      try {
        await Promise.all(
          message.member.guild.channels.map(async channel => {
            return await client.editChannelPermission(
              channel.id,
              role.id,
              0,
              Constants.Permissions.sendMessages |
                Constants.Permissions.addReactions |
                Constants.Permissions.voiceSpeak |
                Constants.Permissions.useApplicationCommands |
                Constants.Permissions.sendMessagesInThreads |
                Constants.Permissions.createPrivateThreads |
                Constants.Permissions.createPublicThreads,
              0,
            )
          }),
        )
      } catch {
        return 'I cannot set permissions for the Muted role.'
      }
    }
    // Can the bot manage this role?
    if (
      role.position >= checkRolePosition(message.member.guild.members.get(client.user.id)) ||
      !message.member.guild.members.get(client.user.id).permissions.has('manageRoles')
    )
      return `I lack permissions to mute people with the role, you ${getInsult()}.`
    // Mute person.
    try {
      await client.addGuildMemberRole(message.member.guild.id, user.id, role.id, args.join(' '))
    } catch {
      return 'Could not mute that person.'
    }
    // Persist the mute.
    const guildID = message.member.guild.id
    // If time given, set timeout to remove role in database.
    try {
      // Figure out the time for which the user is muted.
      let time = 0
      try {
        time = ms(args[0]) || 0
      } catch {
        /* Ignore errors */
      }
      if (time && time >= 2073600000) return { content: 'Mute limit is 24 days.', error: true }
      const mute = await db
        .collection('tasks')
        .findOne({ type: 'unmute', guild: guildID, user: user.id })
      if (!mute && time > 0) {
        // Insert the persisted mute.
        await db.collection('tasks').insertOne({
          type: 'unmute',
          guild: guildID,
          user: user.id,
          target: role.id,
          time: time + Date.now(),
        })
        // If this was modifying a previous mute.
      } else if (mute && time > 0) {
        await db
          .collection('tasks')
          .updateOne(
            { type: 'unmute', guild: guildID, user: user.id },
            { $set: { time: time + Date.now() } },
          )
      }
    } catch {
      return 'Failed to add mute timer! However, user has been muted.'
    }
    // Persist in cache.
    tempDB.mute.add(`${guildID}-${user.id}`)
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
  },
}
