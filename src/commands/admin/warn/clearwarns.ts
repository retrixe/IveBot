import type { Command } from '../../../imports/types.ts'
import { getUser, getInsult } from '../../../imports/tools.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'

export const handleClearwarns: Command = {
  name: 'clearwarns',
  aliases: ['cw', 'clearw'],
  opts: {
    description: 'Clear all warnings a person has.',
    fullDescription: 'Clear all warnings a person has.',
    usage: '/clearwarns <user by ID/username/mention>',
    guildOnly: true,
    example: '/clearwarns voldemort',
    requirements: { permissions: { manageMessages: true } },
  },
  generator: async (message, args, { db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length !== 1) return { content: 'Correct usage: /clearwarns <user>', error: true }
    // Now find the user ID.
    const user = getUser(message, args.shift())
    if (!user)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    // Respect role order.
    if (
      checkRolePosition(message.member.guild.members.get(user.id)) >=
      checkRolePosition(message.member)
    ) {
      return {
        content: `You cannot clear the warnings of this person, you ${getInsult()}.`,
        error: true,
      }
    }
    // Clear the warns of the person internally.
    try {
      await db.collection('warnings').deleteMany({
        warnedId: user.id,
        serverId: message.member.guild.id,
      })
    } catch (err) {
      return `Something went wrong 👾 Error: ${err}`
    }
    // Return response.
    return `Warnings of **${user.username}#${user.discriminator}** have been **cleared**.`
  },
}
