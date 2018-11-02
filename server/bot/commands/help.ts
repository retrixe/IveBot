import { Command as IveBotCommand } from '../imports/types'
import { Command } from '../client'

let generalHelp = `   ** Jony Ive can do many commands 📡**
\`/halp\` and \`/help\` - The most innovative help.
**Games.**
    \`/gunfight\` - For that good ol' fight bro.
    \`/random\` - Return a random number.
    \`/randomword\` - Returns a random word.
    \`/choose\` - Choose between multiple options.
    \`/reverse\` - Reverse a sentence.
    \`/8ball\` - Random answers to random questions.
    \`/repeat\` - Repeat a string.
    \`/calculate\` - Calculate an expression.
**Random searches.**
    \`/urban\` - Get an Urban Dictionary definition ;)
    \`/cat\` and \`/dog\` - Random cats and dogs from <https://random.cat> and <https://dog.ceo>
    \`/robohash\` - Take some text, make it a robot/monster/head/cat.
    \`/zalgo\` \`/dezalgo\` - The zalgo demon's writing.
    \`/namemc\` - A Minecraft user's previous usernames and skin.
    \`/astronomy-picture-of-the-day\` or \`/apod\`
    \`/currency\` - Currency conversion (\`/help currency\`)
**Utilities.**
    TP \`/request\` - Request a specific feature.
    \`/token\` - Links your Discord to IveBot Web (use in DM only)
    \`/weather\` - It's really cloudy here..
    \`/say\` | \`/type\` - Say something, even in another channel.
    \`/editLastSay\` - Even if it was another channel.
    \`/remindme\` - Reminders.
    \`/leave\` - Makes you leave the server.
    \`/avatar\` - Avatar of a user.
    \`/userinfo\` - User info.
    \`/serverinfo\` - Server info 🤔
    \`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
    \`/giverole\` and \`/takerole\` - Edit roles.
**Administrative commands.**
    \`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
    \`/warn\` and \`/warnings\` | \`/clearwarns\` and \`/removewarn\`
    \`/changeserverregion\` and \`/listserverregions\`
    \`/purge\` - Bulk delete a set of messages.
    \`/slowmode\` - When you must slow down chat.

**There are some easter egg auto responses.**
**Commands with TP are test pilot only.**`

const generateDocs = (command: Command) => {
  if (command.aliases && command.aliases.length) {
    return `
**Usage:** ${command.usage}
**Aliases:** ${command.aliases.map(i => '/' + i).join(', ')}
**Description:** ${command.fullDescription}
**Example:** ${command.example}
Arguments in () are optional :P
    `
  }
  return `
**Usage:** ${command.usage}
**Description:** ${command.fullDescription}
**Example:** ${command.example}
Arguments in () are optional :P
  `
}

export const handleHelp: IveBotCommand = {
  name: 'help',
  aliases: ['halp'],
  opts: {
    description: 'The most innovative help.',
    fullDescription: 'The most innovative halp.',
    usage: '/help (command name)',
    example: '/help zalgo'
  },
  generator: async (message, args, { commandParser }) => {
    const commands = commandParser.commands
    const aliasCheck = (i: string) => (
      commands[i].aliases && commands[i].aliases.includes(args.join(' ').split('/').join(''))
    )
    if (
      args.join(' ').split('/').join('') in commands
    ) return generateDocs(commands[args.join(' ').split('/').join('')])
    else if (Object.keys(commands).find(aliasCheck)) {
      return generateDocs(commands[Object.keys(commands).find(aliasCheck)])
    } else if (args.join(' ')) return 'Incorrect parameters. Run /help for general help.'
    const channel = await message.author.getDMChannel()
    channel.createMessage({
      embed: {
        color: 0x00AE86,
        type: 'rich',
        title: 'Help',
        description: generalHelp,
        footer: { text: 'For help on a specific command or aliases, run /help <command>.' }
      }
    })
    return 'newbie, help has been direct messaged to you ✅'
  }
}
