import type { Command } from '../imports/types.ts'
import { execSync } from 'child_process'
import moment from 'moment'
import { host, testPilots } from '../config.ts'
import { runInNewContext } from 'vm'
import { inspect } from 'util'
import { getIdFromMention, getInsult } from '../imports/tools.ts'
import { Base, Constants, type InteractionDataOptionsString } from '@projectdysnomia/dysnomia'
import { readFile } from 'fs/promises'

const { version }: { version: string } = JSON.parse(
  await readFile('package.json', { encoding: 'utf8' }),
)

export const handleVersion: Command = {
  name: 'version',
  aliases: ['ver'],
  opts: {
    description: 'Current running version of IveBot.',
    fullDescription: 'Current running version of IveBot.',
    usage: '/version',
    example: '/version',
    argsRequired: false,
  },
  generator: `**IveBot ${version}**`,
}

export const handleAbout: Command = {
  name: 'about',
  opts: {
    description: 'About IveBot.',
    fullDescription: 'About IveBot.',
    usage: '/about',
    example: '/about',
    argsRequired: false,
  },
  generator: `**IveBot ${version}**
IveBot is a Discord bot written with Dysnomia (Eris continuation) and care.
Unlike most other dumb bots, IveBot was not written with discord.js and has 0% copied code.
Built with community feedback mainly, IveBot does a lot of random stuff and fun.
IveBot 4.0 made a lot of changes under the hood and added support for new Discord features.
For information on what IveBot can do, type **/help** or **/halp**.
The source code can be found here: <https://github.com/retrixe/IveBot>
For noobs, this bot is licensed and protected by law. Copy code and I will sue you for a KitKat.`,
}

export const handleUptime: Command = {
  name: 'uptime',
  opts: {
    description: 'How long was IveBot on?',
    fullDescription: 'How long was IveBot on?',
    usage: '/uptime',
    example: '/uptime',
    argsRequired: false,
  },
  slashGenerator: true,
  generator: () => {
    const d = moment.duration(Math.floor(process.uptime() * 1000))
    const days = Math.floor(d.asDays())
    if (days) {
      return `${days} days ${d.hours()} hours ${d.minutes()} minutes ${d.seconds()} seconds`
    } else if (d.hours()) return `${d.hours()} hours ${d.minutes()} minutes ${d.seconds()} seconds`
    else if (d.minutes()) return `${d.minutes()} minutes ${d.seconds()} seconds`
    return `${d.seconds()} seconds`
  },
}

export const handleRemoteexec: Command = {
  name: 'remoteexec',
  opts: {
    description: 'Execute a command on the host.',
    fullDescription: 'Execute a command on the host. Owner only command.',
    usage: '/remoteexec <command>',
    example: '/remoteexec killall node',
    requirements: {
      userIDs: [host],
    },
  },
  generator: (message, args) => {
    try {
      return execSync(args.join(' '), { encoding: 'utf8' })
    } catch (e) {
      return e.toString()
    }
  },
}

export const handlePing: Command = {
  name: 'ping',
  opts: {
    description: "IveBot's latency.",
    fullDescription: "Latency of IveBot's connection to your server.",
    usage: '/ping',
    example: '/ping',
    argsRequired: false,
  },
  generator: async (message, args) => {
    // Special stuff.
    if (args.length === 1 && testPilots.includes(message.author.id)) {
      try {
        return execSync('ping -c 1 ' + args[0], { encoding: 'utf8' }).split('\n')[1]
      } catch (e) {
        return { content: 'Looks like pinging the website failed.', error: true }
      }
    }
    // Get the time before sending the message.
    const startTime = Date.now()
    // Send the message.
    const sent = await message.channel.createMessage('Ping?')
    // Latency (unrealistic, this can be negative or positive)
    const fl = startTime - Date.now()
    // Divide latency by 2 to get more realistic latency and get absolute value (positive)
    const l = Math.abs(fl) / 2
    // Get latency.
    const e = l < 200 ? `latency of **${l}ms** 🚅🔃` : `latency of **${l}ms** 🔃`
    // Edit the message with the latency.
    await sent.edit(`Aha! IveBot ${version} is connected to your server with a ${e}`)
  },
}

export const handleEval: Command = {
  name: 'eval',
  opts: {
    description: 'Runs JavaScript. Owner only.',
    fullDescription: 'Runs JavaScript. Owner only.',
    usage: '/eval <code in codeblock or not>',
    example: "/eval ```js\nconsole.log('ji')\n```",
    requirements: { userIDs: [host] },
  },
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

export const handleCreationtime: Command = {
  name: 'creationtime',
  aliases: ['ct', 'creation', 'createdat', 'when'],
  opts: {
    description: 'Finds out when a Snowflake (e.g. user ID) was created.',
    fullDescription: 'Finds out when a Snowflake (e.g. user ID) was created.',
    usage: '/creationtime <ID or mention>',
    example: '/creationtime 383591525944262656',
    options: [
      {
        name: 'entities',
        description: 'The users, channels, roles and/or Discord IDs to get the creation time of.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: async ({ data: { options } }) =>
    await handleCreationtime.commonGenerator(
      (options[0] as InteractionDataOptionsString).value
        .trim()
        .split(' ')
        .filter(arg => !!arg),
    ),
  generator: async (message, args) => await handleCreationtime.commonGenerator(args),
  commonGenerator: (args: string[]) => {
    if (args.length === 1) {
      // Just parse it normally.
      let id = args[0]
      id = id.length < 17 && !isNaN(+id) ? id : getIdFromMention(args[0])
      if ((id.length < 17) || isNaN(+id)) {
        return { content: `Provide an valid ID or mention, you ${getInsult()}.`, error: true }
      }
      return moment((new Base(id)).createdAt).format('YYYY/MM/DD, hh:mm:ss A')
    } else {
      const res = args.map(mention => {
        // Parse each ID.
        let id = args[0]
        id = (id.length === 17 || id.length === 18) && !isNaN(+id) ? id : getIdFromMention(args[0])
        if ((id.length !== 17 && id.length !== 18) || isNaN(+id)) {
          return mention + ': invalid!'
        }
        return mention + ': ' + moment((new Base(id)).createdAt).format('YYYY/MM/DD, hh:mm:ss A')
      }).join('\n')
      return {
        content: res,
        allowedMentions: { users: false, roles: false, everyone: false }
      }
    }
  },
}
