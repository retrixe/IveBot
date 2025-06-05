// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import { getInsult, fetchLimited } from '../../imports/tools.ts'

export const handleHastebin: Command = {
  name: 'hastebin',
  aliases: ['hasteb.in', 'texturl', 'hbin', 'haste', 'paste.gg', 'pastegg', 'paste'],
  opts: {
    description: 'Upload a file to paste.gg to view on phone',
    fullDescription: 'Upload a file to paste.gg to view on phone',
    example: '/hastebin <with uploaded text file>',
    usage: '/hastebin <link to text file/uploaded text file>',
    argsRequired: false,
  },
  generator: async (message, args, { client }) => {
    try {
      // Check if a message link was passed.
      const regex =
        /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
      let url =
        args.length > 0
          ? args.join('%20')
          : message.attachments?.find(attachment => !!attachment)?.url
      if (regex.test(url)) {
        const split = url.split('/')
        const mess = await client.getMessage(split[split.length - 2], split.pop())
        url = /^https?:\/\/\S+$/.test(mess.content)
          ? mess.content
          : mess.attachments?.find(attachment => !!attachment)?.url
      }
      // Fetch text file.
      // TODO: Outdated..
      const text = await fetchLimited(url, 0.4)
      if (text === false) return 'The file provided is larger than 400 KB (paste.gg limit)!'
      // Now send the request.
      const req = await fetch('https://api.paste.gg/v1/pastes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'IveBot paste.gg upload',
          files: [
            {
              name: message.attachments?.find(attachment => !!attachment)?.filename ?? 'pastefile1',
              content: { format: 'text', value: text.toString('utf8') },
            },
          ],
        }),
      })
      if (!req.ok) return 'Failed to upload text to paste.gg!'
      // Parse the response.
      const res = (await req.json()) as { result: { id: string; deletion_key: string } }
      const { id, deletion_key: deletionKey } = res.result
      return id
        ? `**paste.gg URL:**\nhttps://paste.gg/p/anonymous/${id}\nDeletion key: ${deletionKey}`
        : 'Failed to upload text to paste.gg!'
    } catch (e) {
      return `Invalid text file, you ${getInsult()}.`
    }
  },
}
