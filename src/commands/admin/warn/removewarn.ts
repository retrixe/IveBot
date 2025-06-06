import { ObjectId } from 'mongodb'
import type { Command } from '../../../imports/types.ts'
import { getUser, getInsult, formatError } from '../../../imports/tools.ts'
import { checkRolePosition } from '../../../imports/permissions.ts'

export const handleRemovewarn: Command = {
  name: 'removewarn',
  aliases: ['rw', 'removew', 'deletewarn', 'deletew', 'dw'],
  opts: {
    description: 'Remove a single warning from a person.',
    fullDescription: 'Remove a single warning from a person.',
    usage: '/removewarn <user by ID/username/mention> <warning ID>',
    guildOnly: true,
    example: '/removewarn voldemort 5adf7a0e825aa7005a4e7be2',
    requirements: { permissions: { manageMessages: true } },
  },
  generator: async (message, args, { db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length !== 2)
      return { content: 'Correct usage: /removewarn <user> <warning ID>', error: true }
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
        content: `You cannot remove a warning from this person, you ${getInsult()}.`,
        error: true,
      }
    }
    // Remove the warning of the person internally.
    try {
      const warn = await db.collection('warnings').findOne({
        _id: new ObjectId(args[0]),
        serverId: message.member.guild.id,
      })
      if (!warn) return { content: 'This warning does not exist..', error: true }
      else if (warn.warnedId !== user.id) {
        return { content: 'This warning does not belong to the specified user..', error: true }
      }
      try {
        await db.collection('warnings').deleteOne({
          _id: new ObjectId(args[0]),
          serverId: message.member.guild.id,
        })
      } catch (e) {
        return `Something went wrong 👾 Error: ${formatError(e)}`
      }
    } catch (err) {
      return `Something went wrong 👾 Error: ${formatError(err)}`
    }
    // Return response.
    return '**Warning has been deleted.**'
  },
}
