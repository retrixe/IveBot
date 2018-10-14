import { Command } from '../imports/types'
import { randomBytes } from 'crypto'
import * as ms from 'ms'
import { version } from '../../../package.json'
import { execSync } from 'child_process'
import 'json5/lib/require'
import * as moment from 'moment'
import { host } from '../../../config.json5'
import { getUser, getInsult } from '../imports/tools'

export const handleUserinfo: Command = {
  name: 'userinfo',
  aliases: ['useri', 'uinfo', 'ui'],
  opts: {
    description: 'Displays info on a particular user.',
    fullDescription: 'Displays info on a particular user.',
    example: '/userinfo voldemort#6931',
    usage: '/userinfo <user by ID/mention/username>',
    argsRequired: false
  },
  generator: async (message, args, { client }) => {
    // Find the user ID.
    const toGet = args.length === 0 ? message.author.id : args.shift()
    let user = getUser(message, toGet)
    if (!user && message.author.id === host && [18, 17].includes(toGet.length) && !isNaN(+toGet)) {
      try { user = await client.getRESTUser(toGet) } catch (e) {}
    }
    if (!user) return `Specify a valid member of this guild, ${getInsult()}.`
    // Display information.
    const member = message.member.guild.members.find(i => i.user.id === user.id)
    const color = member
      ? member.roles.map(i => member.guild.roles.get(i)).sort(
        (a, b) => a.position > b.position ? 0 : 1
      ).shift().color : 0
    return {
      content: `👥 **Userinfo on ${user.username}:**`,
      embed: {
        author: { name: `User info`, icon_url: user.avatarURL },
        title: `${user.username}#${user.discriminator}`,
        description: user.mention,
        thumbnail: { url: user.avatarURL },
        color,
        fields: [
          { name: 'Status', value: member ? member.status : 'N/A', inline: true },
          // { name: 'Join Position }
          // { name: 'Name', value: user.username, inline: true },
          // { name: 'Discriminator', value: user.discriminator, inline: true },
          {
            name: 'Joined server at',
            value: member ? moment(member.joinedAt).format('DD/MM/YYYY, hh:mm:ss A') : 'N/A',
            inline: true
          },
          { name: 'User ID', value: user.id, inline: true },
          {
            name: 'Registered at',
            value: moment(user.createdAt).format('DD/MM/YYYY, hh:mm:ss A'),
            inline: true
          },
          {
            name: `Roles (${member ? member.roles.length : 'N/A'})`,
            value: member ? member.roles.map(i => `<@&${i}>`).join(' ') : 'N/A'
          }
          // { name: 'Permissions' }
        ]
      }
    }
  }
}

export const handleToken: Command = {
  name: 'token',
  opts: {
    description: 'Links your Discord to IveBot Web.',
    fullDescription: 'Links your Discord to IveBot Web (do not share, or your account may be hacked)',
    usage: '/token',
    example: '/token',
    argsRequired: false
  },
  postGenerator: (a, b, sent) => {
    setTimeout(() => { sent.delete() }, 30000)
  },
  generator: async (message, args, { tempDB, client }) => {
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
}

export const handleVersion: Command = {
  name: 'version',
  opts: {
    description: 'Current running version of IveBot.',
    fullDescription: 'Current running version of IveBot.',
    usage: '/version',
    example: '/version',
    argsRequired: false
  },
  generator: () => `**IveBot ${version}**`
}

export const handleAbout: Command = {
  name: 'about',
  opts: {
    description: 'About IveBot.',
    fullDescription: 'About IveBot.',
    usage: '/about',
    example: '/about',
    argsRequired: false
  },
  generator: () => `**IveBot ${version}**
IveBot is a Discord bot written with Eris and care.
Unlike most other dumb bots, IveBot was not written with discord.js and has 0% copied code.
Built with community feedback mainly, IveBot does a lot of random stuff and fun.
IveBot 3.0 is planned to be a port to Eris with multiple new features and a complete rewrite.
For information on what IveBot can do, type **/help** or **/halp**.
The source code can be found here: <https://github.com/retrixe/IveBot>
For noobs, this bot is licensed and protected by law. Copy code and I will sue you for a KitKat.`

}

export const handleUptime: Command = {
  name: 'uptime',
  opts: {
    description: 'How long was IveBot on?',
    fullDescription: 'How long was IveBot on?',
    usage: '/uptime',
    example: '/uptime',
    argsRequired: false
  },
  generator: (message, args, { client }) => ms(client.uptime, { long: true })
}

export const handleRemoteexec: Command = {
  name: 'remoteexec',
  opts: {
    description: 'Execute a command on the host.',
    fullDescription: 'Execute a command on the host. Owner only command.',
    usage: '/remoteexec <command>',
    example: '/remoteexec killall node',
    requirements: {
      userIDs: [host]
    }
  },
  generator: (message, args) => execSync(args.join(' '), { encoding: 'utf8' })
}

export const handlePing: Command = {
  name: 'ping',
  opts: {
    description: 'IveBot\'s latency.',
    fullDescription: 'Latency of IveBot\'s connection to your server.',
    usage: '/ping',
    example: '/ping',
    argsRequired: false
  },
  generator: 'Ping?',
  postGenerator: (message, args, sent) => {
    const startTime = sent.timestamp
    // Latency (unrealistic, this can be negative or positive)
    const fl = startTime - new Date().getTime()
    // Divide latency by 2 to get more realistic latency and get absolute value (positive)
    const l = Math.abs(fl) / 2
    // Get latency.
    const e = l < 200 ? `latency of **${l}ms** 🚅🔃` : `latency of **${l}ms** 🔃`
    sent.edit(`Aha! IveBot ${version} is connected to your server with a ${e}`)
  }
}

export const handleEval: Command = {
  name: 'eval',
  opts: {
    description: 'Runs JavaScript. Owner only.',
    fullDescription: 'Runs JavaScript. Owner only.',
    usage: '/eval <code in codeblock or not>',
    example: '/eval ```js\nconsole.log(\'ji\')\n```',
    requirements: { userIDs: [host] }
  },
  generator: async (message, args, context) => {
    try {
      let toEval = args.join(' ')
      if (toEval.startsWith('```js')) toEval = toEval.substring(5)
      if (toEval.endsWith('```')) toEval = toEval.substring(0, toEval.length - 3)
      // eslint-disable-next-line no-eval
      const res = eval(toEval.split('```').join(''))
      message.addReaction('✅')
      return res || undefined
    } catch (e) {
      const channel = await context.client.getDMChannel(host)
      message.addReaction('❌')
      channel.createMessage(`**Error:**
${e}`)
    }
  }
}
