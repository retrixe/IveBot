// All the types!
import { IveBotCommand } from '../imports/types'
// All the needs!
import 'json5/lib/require'
import { host, testPilots } from '../../../config.json5'

export const handleRequest: IveBotCommand = {
  name: 'request',
  opts: {
    aliases: ['req'],
    requirements: { userIDs: [...testPilots, host] },
    description: 'Request a specific feature.',
    fullDescription: 'Request a feature. Only available to test pilots.',
    usage: '/request <suggestion>'
  },
  generator: (client) => ({ author, content, channel }, args) => {
    client.getDMChannel(host).then((PrivateChannel) => {
      client.createMessage(
        PrivateChannel.id,
        `${author.username}#${author.discriminator} with ID ${author.id}: ${args.join(' ')}`
      )
    })
    return `${author.mention}, what a pathetic idea. It has been DMed to the main developer \
and will be read shortly.
You may recieve a response soon, and you can keep track here:
<https://github.com/retrixe/IveBot/projects/1>`
  }
}
