// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import ms from 'ms'

export const handleRemindme: Command = {
  name: 'remindme',
  aliases: ['rm', 'reminder', 'remind'],
  opts: {
    fullDescription: 'Remind you of something.',
    description: 'Reminders.',
    usage: '/remindme <time in 1d|1h|1m|1s> (--channel|-c) <description>',
    example: '/remindme 1h do your homework',
  },
  generator: async (message, args, { db }) => {
    let channel = false
    if (args[0] === '-c' || args[0] === '--channel') {
      args.splice(0, 1)
      channel = true
    } else if (args[1] === '-c' || args[1] === '--channel') {
      args.splice(1, 1)
      channel = true
    } else if (args[args.length - 1] === '-c' || args[args.length - 1] === '--channel') {
      args.splice(args.length - 1, 1)
      channel = true
    }
    if (args.length < 2 || !ms(args[0])) {
      return {
        content: 'Correct usage: /remindme <time in 1d|1h|1m|1s> (--channel|-c) <description>',
        error: true,
      }
    }
    if (ms(args[0]) > 61 * 1000) {
      // Greater than 61 seconds and it's relegated to the database.
      try {
        const res = await db.collection('tasks').insertOne({
          type: 'reminder',
          time: Date.now() + ms(args[0]),
          user: message.author.id,
          target: channel ? message.channel.id : (await message.author.getDMChannel()).id,
          message: `⏰${
            channel ? message.author.mention + ' ' : ''
          } ${args.slice(1).join(' ')}\nReminder set ${args[0]} ago.`,
        })
        if (!res.acknowledged) return 'Failed to add a reminder to the database!'
      } catch (e) {
        return 'Failed to add a reminder to the database!' + (channel ? '' : ' Can I DM you?')
      }
    } else {
      setTimeout(() => {
        ;(async () => {
          const textChannel = channel ? message.channel : await message.author.getDMChannel()
          const firstLine = channel
            ? `${message.author.mention} ${args.slice(1).join(' ')}`
            : args.slice(1).join(' ')
          await textChannel.createMessage(`⏰ ${firstLine}\nReminder set ${args[0]} ago.`)
        })().catch(() => {})
      }, ms(args[0]))
    }
    return `You will be reminded in ${args[0]} through a ${channel ? 'mention' : 'DM'}.`
  },
}
