// All the types!
import type { Constants, GuildTextableChannel } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
// All the needs!
import { formatPermissionName } from '../../imports/permissions.ts'
import { getInsult, getUser, getMemberColor } from '../../imports/tools.ts'
import { host } from '../../config.ts'

export const handlePermissions: Command = {
  name: 'permissions',
  aliases: ['perms'],
  opts: {
    description: "Displays a particular member's permissions.",
    fullDescription: "Displays a particular member's permissions.",
    example: '/permissions voldemort#6931',
    usage: '/permissions (--ignore-admin) (user by ID/mention/username)',
    argsRequired: false,
    guildOnly: true,
    requirements: { permissions: { manageRoles: true } },
  },
  generator: async (message, args, { client }) => {
    const ignoreAdmin = args.includes('--ignore-admin')
    if (ignoreAdmin) args.splice(args.indexOf('--ignore-admin'), 1)
    // Find the user ID.
    const toGet = args.shift() ?? message.author.id
    let user = getUser(message, toGet)
    if (!user && message.author.id === host && [18, 17].includes(toGet.length) && !isNaN(+toGet)) {
      try {
        user = await client.getRESTUser(toGet)
      } catch {
        /* Ignore errors */
      }
    }
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Display permission info.
    const member = message.member.guild.members.get(user.id)
    const color = member ? getMemberColor(member) : 0
    const permissions = member.permissions
    const permissionKeys = Object.keys(permissions.json) as (keyof Constants['Permissions'])[]
    const channelPerm = (message.channel as GuildTextableChannel).permissionsOf(user.id)
    return {
      content: `✅ **Permissions of ${user.username}:**`,
      embeds: [
        {
          author: {
            name: `${user.username}#${user.discriminator}'s permissions`,
            icon_url: user.avatarURL,
          },
          description: user.mention,
          color,
          fields: [
            {
              name: 'Guild Permissions',
              value:
                message.member.guild.ownerID === user.id && !ignoreAdmin
                  ? 'Owner! (use `/perms --ignore-admin` to show perms regardless)'
                  : permissions.has('administrator') && !ignoreAdmin
                    ? 'Administrator! (use `/perms --ignore-admin` to show perms regardless)'
                    : permissionKeys
                        .filter(perm => permissions.has(perm))
                        .map(formatPermissionName)
                        .join(', '),
            },
            !(message.member.guild.ownerID === user.id || permissions.has('administrator')) ||
            ignoreAdmin
              ? {
                  name: 'Channel Permissions',
                  value:
                    permissionKeys
                      .filter(perm => !permissions.has(perm) && channelPerm.has(perm))
                      .map(formatPermissionName)
                      .join(', ') +
                    permissionKeys
                      .filter(perm => permissions.has(perm) && !channelPerm.has(perm))
                      .map(perm => `**!(${formatPermissionName(perm)})**`)
                      .join(', '),
                }
              : { name: '', value: '' },
          ].filter(e => !!e.value),
          footer: { text: 'User ID: ' + user.id },
        },
      ],
    }
  },
}
