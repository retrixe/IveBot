import type { Command } from '../../imports/types.ts'
import { host } from '../../config.ts'
import { inspect } from 'util'

export const handleEval: Command = {
  name: 'eval',
  opts: {
    description: 'Runs JavaScript. Owner only.',
    fullDescription: 'Runs JavaScript. Owner only.',
    usage: '/eval <code in codeblock or not>',
    example: "/eval ```js\nconsole.log('ji')\n```",
    requirements: { userIDs: [host] },
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generator: async (message, args, { client, tempDB, db, commandParser }) => {
    try {
      let toEval = args.join(' ')
      // Remove extra characters.
      if (toEval.startsWith('`')) toEval = toEval.substring(1)
      if (toEval.startsWith('``js')) toEval = toEval.substring(4)
      else if (toEval.startsWith('``')) toEval = toEval.substring(2)
      if (toEval.endsWith('`')) toEval = toEval.substring(0, toEval.length - 1)
      if (toEval.endsWith('``')) toEval = toEval.substring(0, toEval.length - 2)
      // Evaluate!
      const res = inspect(await Promise.resolve(eval(toEval)), false, 0)
      // const res = eval(`(async () => { const a = ${toEval}; return a })()`)
      message.addReaction('✅').catch(() => {}) // Ignore error.
      const token = (client as unknown as { _token: string })._token
      return res !== 'undefined' ? `${'```'}${res}${'```'}`.replace(token, 'censored') : undefined
    } catch (e) {
      const channel = await client.getDMChannel(host)
      message.addReaction('❌').catch(() => {}) // Ignore error.
      await channel.createMessage(`**Error:**\n${e}`)
    }
  },
}
