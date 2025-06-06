import type { SlashCommand } from '../../imports/types.ts'
import moment from 'moment'

export const handleUptime: SlashCommand = {
  name: 'uptime',
  opts: {
    description: 'How long was IveBot on?',
    fullDescription: 'How long was IveBot on?',
    usage: '/uptime',
    example: '/uptime',
    argsRequired: false,
  },
  slashGenerator: true,
  generator: () => {
    const d = moment.duration(Math.floor(process.uptime() * 1000))
    const days = Math.floor(d.asDays())
    if (days) {
      return `${days} days ${d.hours()} hours ${d.minutes()} minutes ${d.seconds()} seconds`
    } else if (d.hours()) return `${d.hours()} hours ${d.minutes()} minutes ${d.seconds()} seconds`
    else if (d.minutes()) return `${d.minutes()} minutes ${d.seconds()} seconds`
    return `${d.seconds()} seconds`
  },
}
