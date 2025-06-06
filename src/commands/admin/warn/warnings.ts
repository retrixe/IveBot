import moment from 'moment'
import type { Command, Warning } from '../../../imports/types.ts'
import { getUser, getInsult } from '../../../imports/tools.ts'

export const handleWarnings: Command = {
  name: 'warnings',
  aliases: ['warns'],
  opts: {
    description: "Find out about a person's warnings.",
    fullDescription: "Find out about a person's warnings.",
    usage: '/warnings (user by ID/username/mention)',
    example: '/warnings voldemort',
    guildOnly: true,
    argsRequired: false,
    requirements: {
      permissions: { manageMessages: true },
      custom: message =>
        message.content.split(' ').length === 1 ||
        getUser(message, message.content.split(' ')[1]).id === message.author.id,
    },
  },
  generator: async (message, args, { client, db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length > 1)
      return { content: 'Correct usage: /warnings (user by ID/username/mention)', error: true }
    // Now find the user ID.
    let user = args[0] && getUser(message, args[0])
    if (!user && args.length > 0)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    else if (!user) user = message.author
    // Get a list of warnings.
    const warns = await db
      .collection('warnings')
      .find<Warning>({ warnedId: user.id, serverId: message.member.guild.id })
      .toArray()
    // If the person has no warnings..
    if (warns.length === 0) return '**No** warnings found.'
    // Generate the response.
    const format = 'dddd, MMMM Do YYYY, h:mm:ss A' // Date format.
    return {
      content: `🛃 **Warnings for ${user.username}#${user.discriminator}:**`,
      embeds: [
        {
          color: 0x00ae86,
          type: 'rich',
          title: 'Warnings',
          // This function generates the fields.
          fields: warns.map((warning, index) => {
            // If we could find the warner then we specify his/her username+discriminator else ID.
            const warner = client.users.get(warning.warnerId)
            const mod = warner ? `${warner.username}#${warner.discriminator}` : warning.warnerId
            return {
              name: `Warning ${index + 1}`,
              value: `**| Moderator:** ${mod} **| Reason:** ${warning.reason}
**| ID:** ${warning._id.toString()} **| Date:** ${moment(warning.date).format(format)}`,
            }
          }),
        },
      ],
    }
  },
}
