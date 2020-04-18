import { Command as IveBotCommand } from '../imports/types'
import { zeroWidthSpace, getInsult } from '../imports/tools'
import { rootURL } from '../../../config.json5'
import { Command } from '../client'

const generalHelp = {
  description: `**Jony Ive can do many commands 📡**
\`/halp\` and \`/help\` - The most innovative help.`,
  fields: [
    {
      name: '**Games.**', value: `
\`/gunfight\` - For that good ol' fight bro.
\`/random\` - Return a random number.
\`/randomword\` - Returns a random word.
\`/choose\` - Choose between multiple options.
\`/reverse\` - Reverse a sentence.
\`/8ball\` - Random answers to random questions.
\`/repeat\` - Repeat a string.
\`/calculate\` - Calculate an expression.
\`/distort\` - Pretty distorted text.`
    }, {
      name: '**Random searches.**', value: `
\`/urban\` - Get an Urban Dictionary definition ;)
\`/cat\` and \`/dog\` - Random cats and dogs from <https://random.cat> and <https://dog.ceo>
\`/robohash\` - Take some text, make it a robot/monster/head/cat.
\`/zalgo\` \`/dezalgo\` - The zalgo demon's writing.
\`/namemc\` - A Minecraft user's previous usernames and skin.
\`/astronomy-picture-of-the-day\` or \`/apod\`
\`/currency\` - Currency conversion (\`/help currency\`)
\`/xkcd\` - Get the latest or a random xkcd comic.
\`/httpcat\` - Cats for HTTP status codes.`
    }, {
      name: '**Utilities.**', value: `
TP \`/request\` - Request a specific feature.
\`/token\` - Links your Discord to IveBot Web (use in DM only)
\`/weather\` - It's really cloudy here..
\`/say\` | \`/type\` - Say something, even in another channel.
\`/editLastSay\` - Even if it was another channel.
\`/remindme\` - Reminders.
\`/leave\` - Makes you leave the server.
\`/ocr\` - Get text from an image.
\`/avatar\` - Avatar of a user.
\`/userinfo\` - User info.
\`/serverinfo\` - Server info 🤔
\`/creationtime\` - Find out creation time of something by Discord ID.
\`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
\`/emojiImage\` - Image of an emoji.
\`/giverole\` and \`/takerole\` - Edit roles.
\`/notify\` - Ping a role that cannot be pinged.`
    }, {
      name: '**Administrative commands.**', value: `
\`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
\`/addEmoji\`, \`/deleteEmoji\` and \`/editEmoji\`
\`/deleteChannel\` and \`/editChannel\`
\`/warn\` and \`/warnings\` | \`/clearwarns\` and \`/removewarn\`
\`/changeserverregion\` and \`/listserverregions\`
\`/purge\` - Bulk delete a set of messages.
\`/slowmode\` - When you must slow down chat.`
    }, {
      name: zeroWidthSpace,
      value: `**There are some easter egg auto responses.**
**Commands with TP are test pilot only.**`
    }
  ]
}

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
    example: '/help zalgo',
    argsRequired: false
  },
  generator: async (message, args, { commandParser }) => {
    const commands = commandParser.commands
    const command = args.join(' ').split('/').join('').toLowerCase()
    const check = (i: string) => (
      // First checks for name, 2nd for aliases.
      commands[i].name.toLowerCase() === command ||
      (commands[i].aliases && commands[i].aliases.includes(command))
    )
    // Check if requested for a specific command.
    if (Object.keys(commands).find(check)) {
      return generateDocs(commands[Object.keys(commands).find(check)])
    } else if (args.join(' ')) return 'Incorrect parameters. Run /help for general help.'
    // Default help.
    try {
      const channel = await message.author.getDMChannel()
      await channel.createMessage({
        content: `**IveBot's dashboard**: ${rootURL || 'https://ivebot.now.sh'}/
(Manage Server required to manage a server)`,
        embed: {
          color: 0x00AE86,
          type: 'rich',
          title: 'Help',
          ...generalHelp,
          footer: { text: 'For help on a specific command or aliases, run /help <command>.' }
        }
      })
      return 'newbie, help has been direct messaged to you ✅'
    } catch {
      return `I cannot DM you the help for newbies, you ${getInsult()} ❌`
    }
  }
}
