// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import { getInsult, fetchLimited } from '../../imports/tools.ts'
// Get the NASA API token.
import { cvAPIkey } from '../../config.ts'

export const handleOcr: Command = {
  name: 'ocr',
  aliases: ['textrecognition', 'itt', 'textr', 'text'],
  opts: {
    description: 'Get text from an image.',
    fullDescription: 'Get text from an image. Powered by Google Cloud Vision.',
    example: '/ocr <with uploaded image>',
    usage: '/ocr (--hastebin) <link to image/uploaded image/reply to an image>',
    argsRequired: false,
  },
  generator: async (message, args, { client }) => {
    // To hasteb.in or not to hasteb.in.
    const useHastebin = args[0] === '--hastebin'
    if (useHastebin) args.shift()
    // Get the image and convert it to Base64.
    try {
      let url =
        args.length > 0
          ? args.join('%20')
          : message.attachments?.find(attachment => !!attachment)?.url
      if (message.messageReference) {
        const reference = message.messageReference
        const mess =
          message.referencedMessage ||
          (await client.getMessage(reference.channelID, reference.messageID))
        url = /^https?:\/\/\S+$/.test(mess.content)
          ? mess.content
          : mess.attachments?.find(attachment => !!attachment)?.url
      } else {
        // Check if a message link was passed.
        const regex =
          /https?:\/\/((canary|ptb|www).)?discord(app)?.com\/channels\/\d{17,18}\/\d{17,18}\/\d{17,18}/
        if (regex.test(url)) {
          const split = url.split('/')
          const mess = await client.getMessage(split[split.length - 2], split.pop())
          url = /^https?:\/\/\S+$/.test(mess.content)
            ? mess.content
            : mess.attachments?.find(attachment => !!attachment)?.url
        }
      }
      if (!url) return `Invalid image URL, you ${getInsult()}.`
      // const image = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
      const fetchedImage = await fetchLimited(url, 16)
      if (fetchedImage === false) return 'The file provided is larger than 16 MB!'
      const image = fetchedImage.toString('base64')
      // Now send the request.
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${cvAPIkey}`, {
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
        method: 'POST',
      })
      // Parse the response.
      const result = (await res.json()) as {
        responses: { fullTextAnnotation: { text: string } }[]
      }
      // If no text was found.
      if (!result.responses[0].fullTextAnnotation)
        return 'I was unable to get any results for the image.'
      // If the result is too long, upload it to paste.gg.
      const text = result.responses[0].fullTextAnnotation.text
      let hastebin = ''
      let deletionKey = ''
      try {
        if (text.length > 2000 || useHastebin) {
          const { result } = await fetch('https://api.paste.gg/v1/pastes', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: 'IveBot /ocr result',
              files: [{ content: { format: 'text', value: text } }],
            }),
          }).then(async e => (await e.json()) as { result: { id: string; deletion_key: string } })
          hastebin = result.id
          deletionKey = result.deletion_key
        }
      } catch {
        return `Failed to upload long OCR result to paste.gg! (${text.length} characters long)`
      }
      // Return our answer.
      return {
        content: hastebin
          ? `🤔 **Text recognition result uploaded to paste.gg${!useHastebin ? ' due to length' : ''}:**
https://paste.gg/p/anonymous/${hastebin} (use this key to delete: \`${deletionKey}\`)`
          : `🤔 **Text recognition result:**\n${text}`,
        embeds: [
          {
            color: 0x666666,
            author: {
              name: `${message.author.username}#${message.author.discriminator}'s Image`,
              icon_url: message.author.avatarURL,
            },
            footer: {
              text: 'Powered by Google Cloud Vision API',
              icon_url:
                'https://www.gstatic.com/devrel-devsite/prod/' +
                'v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/cloud/images/' +
                'favicons/onecloud/favicon.ico',
            },
            timestamp: new Date(message.timestamp).toISOString(),
          },
        ],
      }
    } catch (e) {
      console.error(e)
      return `Invalid image URL, you ${getInsult()}.`
    }
  },
}
