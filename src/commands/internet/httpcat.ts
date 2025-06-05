// All the types!
import type { Command } from '../../imports/types.ts'

export const handleHttpCat: Command = {
  name: 'httpcat',
  aliases: ['http.cat'],
  opts: {
    description: 'Get an HTTP cat from https://http.cat',
    fullDescription: 'Get an HTTP cat from https://http.cat',
    example: '/httpcat <HTTP error code>',
    usage: '/httpcat 200',
    argsRequired: false,
  },
  generator: async (message, args) => {
    if (isNaN(+args[0]) || args.length > 1) return 'Enter a valid HTTP status code!'

    const req = await fetch('https://http.cat/' + args[0], { method: 'HEAD' })
    if (req.status === 404)
      return { content: 'Enter a valid HTTP status code!\nhttps://http.cat/404', error: true }

    return 'https://http.cat/' + args[0]
  },
}
