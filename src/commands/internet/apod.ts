// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import moment from 'moment'
// Get the NASA API token.
import { NASAtoken } from '../../config.ts'

interface ApodResponse {
  url: string
  hdurl: string
  title: string
  media_type: string
  explanation: string
}

export const handleApod: Command = {
  name: 'astronomy-picture-of-the-day',
  aliases: ['apod'],
  opts: {
    description: 'The astronomy picture of the day.',
    fullDescription: 'The astronomy picture of the day. Truly beautiful. Usually.',
    usage: '/astronomy-picture-of-the-day (date)',
    example: '/astronomy-picture-of-the-day 2nd March 2017',
    argsRequired: false,
  },
  generator: async (message, args) => {
    // Check for date.
    const date = moment(args.join(' '), [
      moment.ISO_8601,
      moment.RFC_2822,
      'Do M YYYY',
      'Do MM YYYY',
      'Do MMM YYYY',
      'Do MMMM YYYY',
      'D M YYYY',
      'D MM YYYY',
      'D MMM YYYY',
      'D MMMM YYYY',
    ])
    if (date.isValid()) {
      const dateStr = date.format('YYYY-MM-DD')
      // Fetch a picture or video.
      try {
        const {
          media_type: mediaType,
          url,
          title,
          explanation,
        } = (await (
          await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}&date=${dateStr}`)
        ).json()) as ApodResponse
        return mediaType === 'video'
          ? `**${title}**\n${explanation}\n${url.split('embed/').join('watch?v=')}`
          : {
              content: `**${title}**\n${explanation}`,
              embeds: [{ image: { url }, color: 0x2361be }],
            }
      } catch (err) {
        return `Something went wrong 👾 Error: ${err}`
      }
    } else if (args.length > 0) {
      return { content: 'Invalid date.', error: true }
    }
    // Fetch a picture or video.
    try {
      const {
        media_type: mediaType,
        url,
        hdurl,
        title,
        explanation,
      } = (await (
        await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`)
      ).json()) as ApodResponse
      return mediaType === 'video'
        ? `**${title}**\n${explanation}\n${url.split('embed/').join('watch?v=')}`
        : {
            content: `**${title}**\n${explanation}`,
            embeds: [{ image: { url: hdurl }, color: 0x2361be }],
          }
    } catch (err) {
      return `Something went wrong 👾 Error: ${err}`
    }
  },
}
