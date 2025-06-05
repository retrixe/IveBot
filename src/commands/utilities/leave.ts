import type { Command } from '../../imports/types.ts'

export const handleLeave: Command = {
  opts: {
    description: 'Makes you leave the server.',
    fullDescription: 'This kicks you from the server, essentially making you leave.',
    usage: '/leave',
    example: '/leave',
    errorMessage: 'There was an error processing your request.',
    guildOnly: true,
    argsRequired: false,
  },
  name: 'leave',
  generator: async (message, args, { tempDB, client }) => {
    if (!tempDB.leave.has(message.author.id)) {
      tempDB.leave.add(message.author.id)
      setTimeout(() => {
        if (!tempDB.leave.has(message.author.id)) return
        message.channel
          .createMessage(message.author.mention + ' your leave request has timed out.')
          .then(() => tempDB.leave.delete(message.author.id))
          .catch(() => tempDB.leave.delete(message.author.id))
      }, 30000)
      return (
        'Are you sure you want to leave the server? ' +
        'You will require an invite link to join back. Type /leave to confirm.'
      )
    } else {
      tempDB.leave.delete(message.author.id)
      try {
        await client.kickGuildMember(message.member.guild.id, message.author.id, 'Used /leave.')
      } catch (e) {
        return 'You will have to manually leave the server or transfer ownership before leaving.'
      }
      return `${message.author.username}#${message.author.discriminator} has left the server.`
    }
  },
}
