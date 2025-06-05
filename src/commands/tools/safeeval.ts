import type { Command } from '../../imports/types.ts'
import { testPilots } from '../../config.ts'
import { runInNewContext } from 'vm'
import { inspect } from 'util'

export const handleSafeeval: Command = {
  name: 'safeEval',
  aliases: ['se'],
  opts: {
    description: 'Runs JavaScript in a highly sandboxed environment.',
    fullDescription: `Runs JavaScript in a highly sandboxed environment.
Available variables: content
Available functions:
getContent/getCleanContent(messageID), createMessage(content), getReactions(messageID)`,
    usage: '/safeEval <code in codeblock or not>',
    example: "/safeEval ```js\ncreateMessage('You sent: ' + content)\n```",
    requirements: { userIDs: testPilots },
  },
  generator: async (message, args, context) => {
    try {
      let toEval = args.join(' ')
      // Remove extra characters.
      if (toEval.startsWith('`')) toEval = toEval.substring(1)
      if (toEval.startsWith('``js')) toEval = toEval.substring(4)
      if (toEval.endsWith('`')) toEval = toEval.substring(0, toEval.length - 1)
      if (toEval.endsWith('``')) toEval = toEval.substring(0, toEval.length - 2)
      // Evaluate!
      const result = runInNewContext(toEval.split('```').join(''), {
        createMessage: async (co: string) => {
          return (await context.client.createMessage(message.channel.id, co)).content
        },
        content: message.content,
        getContent: async (id: string) => (await message.channel.getMessage(id)).content,
        getCleanContent: async (id: string) => (await message.channel.getMessage(id)).cleanContent,
        getReactions: async (id: string) => (await message.channel.getMessage(id)).reactions,
      })
      const res = inspect(await Promise.resolve(result), false, 0)
      message.addReaction('✅').catch(() => {}) // Ignore error.
      const token = (context.client as unknown as { _token: string })._token
      return res !== 'undefined' ? `${'```'}${res.replace(token, '')}${'```'}` : undefined
    } catch (e) {
      message.addReaction('❌').catch(() => {}) // Ignore error.
      return { content: `**Error:**\n${e}`, error: true }
    }
  },
}
