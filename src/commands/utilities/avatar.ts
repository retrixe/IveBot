// All the types!
import type { Message } from '@projectdysnomia/dysnomia'
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getUser } from '../../imports/tools.ts'

export const handleAvatar: Command = {
  name: 'avatar',
  aliases: ['av'],
  opts: {
    fullDescription: 'Get a large-sized link to the avatar of a user.',
    description: 'Avatar of a user.',
    usage: '/avatar <user>',
    example: '/avatar @voldemort#6931',
    argsRequired: false,
  },
  generator: (message, args) => {
    let user: Message['author'] = getUser(message, args.join(' ')) || message.author
    if (!user && message.mentions.length !== 0) user = message.mentions[0]
    const member = message.member.guild.members.get(user.id)
    const format = user.avatar?.startsWith('a_') ? 'gif' : 'png'
    return {
      content: '**Avatar:**',
      embeds: [
        {
          author: { name: `${user.username}#${user.discriminator}`, icon_url: user.avatarURL },
          image: { url: user.dynamicAvatarURL(format, 2048) },
          description: `**[Link](${user.dynamicAvatarURL(format, 2048)})**`,
          color: member.roles
            .map(i => member.guild.roles.get(i))
            .sort((a, b) => (a.position > b.position ? -1 : 1))
            .shift()?.color,
        },
      ],
    }
  },
}
