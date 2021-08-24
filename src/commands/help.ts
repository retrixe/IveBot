import { zeroWidthSpace, getInsult } from '../imports/tools.js'
import { Command as IveBotCommand } from '../imports/types.js'
import CommandParser, { Command } from '../client.js'
import { rootURL } from '../config.js'
import { Client } from 'eris'
import { CommandOptionType } from 'slash-create'

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
\`/trivia\` - Start a trivia game on a topic of your choice.
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
\`/remindme\` | \`/reminderlist\` - Reminders.
\`/leave\` - Makes you leave the server.
\`/ocr\` - Get text from an image.
\`/avatar\` - Avatar of a user.
\`/userinfo\` - User info.
\`/serverinfo\` - Server info 🤔
\`/creationtime\` - Find out creation time of something by Discord ID.
\`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
\`/emojiImage\` - Image of an emoji.
\`/giverole\` and \`/takerole\` - Edit roles.
\`/notify\` - Ping a role that cannot be pinged.
\`/hastebin\` - Upload a file to hasteb.in to view on phone.
\`/suppress\` - Suppress or unsuppress embeds in a message.`
    }, {
      name: '**Administrative commands.**', value: `
\`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
\`/addEmoji\`, \`/deleteEmoji\` and \`/editEmoji\`
\`/deleteChannel\` and \`/editChannel\`
\`/warn\`, \`/warnings\`, \`/clearwarns\` and \`/removewarn\`
\`/changevoiceregion\` and \`/listvoiceregions\`
\`/perms\` - Displays a particular member's permissions.
\`/purge\` - Bulk delete a set of messages.
\`/slowmode\` - When you must slow down chat.`
    }, {
      name: zeroWidthSpace,
      value: `**There are some easter egg auto responses.**
**Commands with TP are test pilot only.**`
    }
  ]
}

const generateDocs = (command: Command): string => {
  let requirements = ''
  if (command.requirements) {
    const permissions = command.requirements.permissions
      ? `Needs the permissions: ${Object.keys(command.requirements.permissions).map(perm => (
        perm.substr(0, 1).toUpperCase() + perm.substr(1)
      ).replace(/[A-Z]+/g, s => ' ' + s).trim()).join(', ').replace('TTSMessages', 'TTS Messages')} | `
      : ''
    const roleNames = command.requirements.roleNames
      ? `Needs the roles: ${command.requirements.roleNames.join(', ')} | `
      : ''
    const roleIDs = command.requirements.roleIDs ? 'Usable by users with a certain role | ' : ''
    const userIDs = command.requirements.userIDs ? 'Usable by certain users | ' : ''
    const custom = command.requirements.custom
      ? '\n**Requirements:** Has some unknown permission checks | '
      : ''
    requirements = custom || (permissions || roleIDs || roleNames || userIDs
      ? `\n**Requirements:** ${custom}${permissions}${roleIDs}${roleNames}${userIDs}`
      : '')
  }

  if (command.aliases && (command.aliases.length > 0)) {
    return `
**Usage:** ${command.usage}
**Aliases:** ${command.aliases.map(i => '/' + i).join(', ')}
**Description:** ${command.fullDescription}
**Example:** ${command.example}${requirements.substr(0, requirements.length - 3)}
Arguments in () are optional :P
    `
  }
  return `
**Usage:** ${command.usage}
**Description:** ${command.fullDescription}
**Example:** ${command.example}${requirements.substr(0, requirements.length - 3)}
Arguments in () are optional :P
  `
}

export const handleHelp: IveBotCommand = {
  name: 'help',
  aliases: ['halp', 'hulp', 'gethelp', 'commands'],
  opts: {
    description: 'The most innovative help.',
    fullDescription: 'The most innovative halp.',
    usage: '/help (command name)',
    example: '/help zalgo',
    argsRequired: false,
    slashOptions: [{ // TODO: Should this response be ephemeral?
      name: 'command',
      description: 'Name of the command to get help on.',
      type: CommandOptionType.STRING,
      required: false
    }]
  },
  slashGenerator: async ({ user, options }, { client, commandParser }) => (
    await handleHelp.commonGenerator(user.id, options.command, client, commandParser)
  ),
  generator: async (message, args, { client, commandParser }) => (
    await handleHelp.commonGenerator(message.author.id, args.join(' '), client, commandParser)
  ),
  commonGenerator: async (author: string, command: string, client: Client, parser: CommandParser) => {
    const commands = parser.commands
    const commandName = command.split('/').join('').toLowerCase()
    const check = (i: string): boolean => (
      // First checks for name, 2nd for aliases.
      commands[i].name.toLowerCase() === commandName ||
      (commands[i].aliases && commands[i].aliases.includes(commandName))
    )
    // Check if requested for a specific command.
    if (Object.keys(commands).find(check)) {
      return generateDocs(commands[Object.keys(commands).find(check)])
    } else if (command) return { content: 'Incorrect parameters. Run /help for general help.', error: true }
    // Default help.
    try {
      const channel = await client.getDMChannel(author)
      await channel.createMessage({
        content: `**IveBot's dashboard**: ${rootURL || 'https://ivebot.now.sh'}/
(Manage Server required to manage a server)`,
        embed: {
          color: 0x00AE86,
          // type: 'rich',
          title: 'Help',
          ...generalHelp,
          footer: { text: 'For help on a specific command or aliases, run /help <command>.' }
        }
      })
      return 'newbie, help has been direct messaged to you ✅'
    } catch {
      return { content: `I cannot DM you the help for newbies, you ${getInsult()} ❌`, error: true }
    }
  }
}
