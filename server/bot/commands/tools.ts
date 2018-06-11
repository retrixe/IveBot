import { IveBotCommand } from '../imports/types'
import { randomBytes } from 'crypto'
import * as ms from 'ms'
import { version } from '../../../package.json'
import { execSync } from 'child_process'
import 'json5/lib/require'
import { host } from '../../../config.json5'

export const handleToken: IveBotCommand = (client, tempDB) => ({
  name: 'token',
  opts: {
    description: 'Links your Discord to IveBot Web.',
    fullDescription: 'Links your Discord to IveBot Web (use in DM only, or your account may be hacked)',
    usage: '/token',
    argsRequired: false,
    hooks: {
      postCommand: (a, b, sent) => {
        setTimeout(() => { client.deleteMessage(sent.channel.id, sent.id) }, 30000)
      }
    }
  },
  generator: async (message) => {
    let secureToken = randomBytes(3).toString('hex')
    tempDB.link[secureToken] = message.author.id
    // The DM part.
    try {
      const dm = await client.getDMChannel(message.author.id)
      try {
        const message = await client.createMessage(
          dm.id, 'Your token is: **' + secureToken + '** | **DO NOT SHARE THIS WITH ANYONE >_<**'
        )
        setTimeout(() => { client.deleteMessage(dm.id, message.id) }, 30000)
      } catch (e) { return 'There was an error processing your request (unable to DM token)' }
    } catch (e) { return 'There was an error processing your request (unable to DM)' }
    // The non-DM part.
    return 'The token has been DMed ✅' +
      ' | **It will be deleted after 30 seconds.** | **DO NOT SHARE THIS WITH ANYONE >_<**'
  }
})

export const handleVersion: IveBotCommand = () => ({
  name: 'version',
  opts: {
    description: 'Current running version of IveBot.',
    fullDescription: 'Current running version of IveBot.',
    usage: '/version',
    argsRequired: false
  },
  generator: `**IveBot ${version}**`
})

export const handleAbout: IveBotCommand = () => ({
  name: 'about',
  opts: {
    description: 'About IveBot.',
    fullDescription: 'About IveBot.',
    usage: '/about',
    argsRequired: false
  },
  generator: `**IveBot ${version}**
IveBot is a Discord bot written with Eris and care.
Unlike most other dumb bots, IveBot was not written with discord.js and has 0% copied code.
Built with community feedback mainly, IveBot does a lot of random stuff and fun.
IveBot 2.0 is planned to be built complete with administrative commands and a web dashboard.
For information on what IveBot can do, type **/help** or **/halp**.
The source code can be found here: <https://github.com/retrixe/IveBot>
For noobs, this bot is licensed and protected by law. Copy code and I will sue you for a KitKat.`
})

export const handleUptime: IveBotCommand = (client) => ({
  name: 'uptime',
  opts: {
    description: 'How long was IveBot on?',
    fullDescription: 'How long was IveBot on?',
    usage: '/uptime',
    argsRequired: false
  },
  generator: () => ms(client.uptime, { long: true })
})

export const handleRemoteexec: IveBotCommand = (client) => ({
  name: 'remoteexec',
  opts: {
    description: 'Execute a command on the host.',
    fullDescription: 'Execute a command on the host. Owner only command.',
    usage: '/remoteexec <command>',
    requirements: {
      userIDs: [host]
    }
  },
  generator: (message, args) => execSync(args.join(' '), { encoding: 'utf8' })
})

export const handlePing: IveBotCommand = (client) => ({
  name: 'ping',
  opts: {
    description: 'IveBot\'s latency.',
    fullDescription: 'Latency of IveBot\'s connection to your server.',
    usage: '/ping',
    argsRequired: false,
    hooks: {
      postCommand: (message, args, sent) => {
        const startTime = sent.timestamp
        // Latency (unrealistic, this can be negative or positive)
        const fl = startTime - new Date().getTime()
        // Divide latency by 2 to get more realistic latency and get absolute value (positive)
        const l = Math.abs(fl) / 2
        // Get latency.
        const e = l < 200 ? `latency of **${l}ms** 🚅🔃` : `latency of **${l}ms** 🔃`
        client.editMessage(
          sent.channel.id, sent.id, `Aha! IveBot ${version} is connected to your server with a ${e}`
        )
      }
    }
  },
  generator: 'Ping?'
})
