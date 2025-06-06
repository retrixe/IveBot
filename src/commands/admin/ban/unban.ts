import type { Command } from '../../../imports/types.ts'
import { getInsult } from '../../../imports/tools.ts'

export const handleUnban: Command = {
  name: 'unban',
  opts: {
    description: 'Unban someone.',
    fullDescription: 'Unban someone.',
    usage: '/unban <user by ID/username/mention> (reason)',
    example: '/unban voldemort wrong person',
    guildOnly: true,
    requirements: { permissions: { banMembers: true } },
  },
  generator: async (message, args, { client }) => {
    // Check bot for permissions.
    if (!message.member.guild.members.get(client.user.id).permissions.has('banMembers')) {
      return `I lack permission to unban members, you ${getInsult()}.`
    }
    // Find the user ID.
    const userSpecified = args.shift()
    let user = client.users.find(i => i.username === userSpecified)
    if (client.users.find(i => i.username === userSpecified)) {
      user = client.users.find(i => i.username === userSpecified)
    } else if (client.users.get(userSpecified)) {
      user = client.users.get(userSpecified)
    } else {
      try {
        user = await client.getRESTUser(userSpecified)
      } catch {
        /* Ignore errors */
      }
    }
    if (!user) return { content: 'I cannot find that user.', error: true }
    // Now we unban the person.
    try {
      await client.unbanGuildMember(message.member.guild.id, user.id, args.join(' '))
    } catch {
      return 'That user could not be unbanned.'
    }
    return `**${user.username}#${user.discriminator}** has been unbanned.`
  },
}
