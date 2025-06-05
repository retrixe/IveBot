// All the types!
import type { Command } from '../../imports/types.ts'
// All the needs!
import { getInsult, getUser } from '../../imports/tools.ts'
import { host } from '../../config.ts'
import moment from 'moment'

export const handleReminderlist: Command = {
  name: 'reminderlist',
  aliases: ['remindmelist', 'remindlist', 'rmlist', 'rml'],
  opts: {
    description: "List the reminders I've set.",
    fullDescription: "List the reminders I've set.",
    usage: '/reminderlist',
    example: '/reminderlist',
    argsRequired: false,
  },
  generator: async (message, args, { db }) => {
    // If improper arguments were provided, then we must inform the user.
    if (args.length > 0 && message.author.id !== host)
      return { content: 'Correct usage: /reminderlist', error: true }
    // Now find the user ID.
    let user = args[0] && getUser(message, args[0])
    if (!user && args.length > 0)
      return { content: `Specify a valid member of this guild, ${getInsult()}.`, error: true }
    else if (!user) user = message.author
    // Get a list of reminders.
    const id = user.id
    const reminders = await db.collection('tasks').find({ type: 'reminder', user: id }).toArray()
    // If the person has no reminders..
    if (reminders.length === 0) return '**No** reminders found.'
    // Generate the response.
    const format = 'dddd, MMMM Do YYYY, h:mm:ss A' // Date format.
    return {
      content: `⏰ **Reminders for ${user.username}#${user.discriminator}:**`,
      embeds: [
        {
          color: 0x00ae86,
          type: 'rich',
          title: 'Reminders',
          // This function generates the fields.
          fields: reminders.map((reminder, index) => ({
            name: `Reminder ${index + 1}`,
            // TODO: Switch to Discord timestamps for reminders.
            value: `**Due time:** ${moment(reminder.time).format(format)}
**Channel:** <#${reminder.target}>
**Message:** ${reminder.message.substring(1, reminder.message.lastIndexOf('\n')).trim()}`,
          })),
        },
      ],
    }
  },
}
