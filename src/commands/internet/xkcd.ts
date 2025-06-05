// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import Fuse from 'fuse.js'

const noimageposts = ['1037', '1608', '1663']
export const handleXkcd: Command = {
  name: 'xkcd',
  opts: {
    description: 'Get the latest, random or search for an xkcd comic.',
    fullDescription: 'Get the latest, random or search for an xkcd comic.',
    usage: '/xkcd (latest (default)|random|search) (search query, if searching)',
    example: '/xkcd random',
    argsRequired: false,
  },
  generator: async (message, args) => {
    if (args.length >= 2 && args[0] === 'search') {
      try {
        // Fetch all posts and parse the HTML.
        const req = await fetch('https://xkcd.com/archive')
        if (!req.ok) return 'Failed to fetch list of xkcd comics!\nhttps://xkcd.com/1348'
        const posts = (await req.text())
          .split('<br/>')
          .map(e => ({
            name: e
              .substring(0, e.length - 4)
              .split('>')
              .pop(),
            id: e
              .substring(e.lastIndexOf('href="/') + 7)
              .split('/"')
              .shift(),
          }))
          .slice(4)
        posts.splice(posts.length - 11, 11) // Slice and splice invalid elements.
        // Construct search result. Default threshold was 0.6, 0.4 is more precise.
        const fuse = new Fuse(posts, { keys: ['name', 'id'], threshold: 0.4 })
        const res = fuse
          .search(args.slice(1).join(' '), { limit: 3 })
          .map(e =>
            noimageposts.includes(e.item.id) ? { ...e.item, id: e.item.id + '(no image)' } : e.item,
          )
        if (res.length === 0)
          return { content: 'No results were found for your search criteria!', error: true }
        const res1 = 'https://xkcd.com/' + res[0].id
        const res2 = res[1] ? `\n2. <https://xkcd.com/${res[1].id}>` : ''
        const res3 = res[2] ? `\n3. <https://xkcd.com/${res[2].id}>` : ''
        return `**Top results:**\n1. ${res1}${res2}${res3}`
      } catch (e) {
        console.error(e)
        return 'Failed to fetch list of xkcd comics!\nhttps://xkcd.com/1348'
      }
    } else if (
      args.length > 1 ||
      (args.length === 1 && args[0] !== 'latest' && args[0] !== 'random')
    )
      return {
        content: 'Correct usage: /xkcd (latest|random|search) (search query if searching)',
        error: true,
      }
    // Get the latest xkcd comic.
    try {
      const { num } = (await (await fetch('http://xkcd.com/info.0.json')).json()) as { num: number }
      if (args[0] === 'random')
        return `https://xkcd.com/${Math.floor(Math.random() * (num - 1)) + 1}`
      else return `https://xkcd.com/${num}`
    } catch (e) {
      return 'Failed to fetch an xkcd comic!\nhttps://xkcd.com/1348'
    }
  },
}
