// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getInsult, getUser, getMemberColor } from '../../imports/tools.ts'
import { host } from '../../config.ts'
import moment from 'moment'

export const handleUserinfo: Command = {
  name: 'userinfo',
  aliases: ['useri', 'uinfo', 'ui'],
  opts: {
    description: 'Displays info on a particular user.',
    fullDescription: 'Displays info on a particular user.',
    example: '/userinfo voldemort#6931',
    usage: '/userinfo (user by ID/mention/username)',
    argsRequired: false,
  },
  generator: async (message, args, { client }) => {
    // Find the user ID.
    const toGet = args.length === 0 ? message.author.id : args.shift()
    let user = getUser(message, toGet)
    if (!user && message.author.id === host && [18, 17].includes(toGet.length) && !isNaN(+toGet)) {
      try {
        user = await client.getRESTUser(toGet)
      } catch {
        /* Ignore error */
      }
    }
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Display information.
    const member = message.member.guild.members.get(user.id)
    // TODO: Add publicFlags, game, premiumSince, custom-status. Support per-server pfp, about me, banner.
    const color = member ? getMemberColor(member) : 0
    return {
      content: `👥 **Userinfo on ${user.username}:**`,
      embeds: [
        {
          author: { name: 'User info', icon_url: user.avatarURL },
          title: `${user.username}#${user.discriminator}` + (user.bot ? ' (Bot account)' : ''),
          description: user.mention + (member?.pending ? ' (pending guild screening)' : ''),
          thumbnail: { url: user.dynamicAvatarURL('png', 2048) },
          color,
          fields: [
            { name: 'Status', value: member?.status ?? 'N/A', inline: true },
            // { name: 'Join Position }
            {
              name: 'Joined server at',
              value: member ? moment(member.joinedAt).format('DD/MM/YYYY, hh:mm:ss A') : 'N/A',
              inline: true,
            },
            {
              name: 'Registered at',
              value: moment(user.createdAt).format('DD/MM/YYYY, hh:mm:ss A'),
              inline: true,
            },
            // Game...
            // Badges...
            // Boosting since..
            {
              name: `Roles (${member ? member.roles.length : 'N/A'})`,
              value: member
                ? member.roles
                    .map(i => member.guild.roles.get(i))
                    .sort((a, b) => (a.position > b.position ? -1 : 1))
                    .map(i => `<@&${i.id}>`)
                    .join(' ')
                : 'N/A',
            },
            {
              name: 'Permissions',
              value: member ? 'Run `/perms <user>` to get their permissions!' : 'N/A',
            },
          ],
          footer: { text: 'User ID: ' + user.id },
        },
      ],
    }
  },
}
