import type { Command } from '../../imports/types.ts'
import { execSync } from 'child_process'
import { testPilots } from '../../config.ts'
import { readFile } from 'fs/promises'

const { version }: { version: string } = JSON.parse(
  await readFile('package.json', { encoding: 'utf8' }),
)

export const handlePing: Command = {
  name: 'ping',
  opts: {
    description: "IveBot's latency.",
    fullDescription: "Latency of IveBot's connection to your server.",
    usage: '/ping',
    example: '/ping',
    argsRequired: false,
  },
  generator: async (message, args) => {
    // Special stuff.
    if (args.length === 1 && testPilots.includes(message.author.id)) {
      try {
        return execSync('ping -c 1 ' + args[0], { encoding: 'utf8' }).split('\n')[1]
      } catch (e) {
        return { content: 'Looks like pinging the website failed.', error: true }
      }
    }
    // Get the time before sending the message.
    const startTime = Date.now()
    // Send the message.
    const sent = await message.channel.createMessage('Ping?')
    // Latency (unrealistic, this can be negative or positive)
    const fl = startTime - Date.now()
    // Divide latency by 2 to get more realistic latency and get absolute value (positive)
    const l = Math.abs(fl) / 2
    // Get latency.
    const e = l < 200 ? `latency of **${l}ms** 🚅🔃` : `latency of **${l}ms** 🔃`
    // Edit the message with the latency.
    await sent.edit(`Aha! IveBot ${version} is connected to your server with a ${e}`)
  },
}
