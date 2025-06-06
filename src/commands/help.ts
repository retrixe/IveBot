import { formatPermissionName } from '../imports/permissions.ts'
import { zeroWidthSpace, getInsult } from '../imports/tools.ts'
import type { SlashCommand } from '../imports/types.ts'
import type { Command } from '../client.ts'
import type CommandParser from '../client.ts'
import { rootURL } from '../config.ts'
import { type Client, Constants } from '@projectdysnomia/dysnomia'

const generalHelp = {
  description: `**Jony Ive can do many commands 📡**
\`/halp\` and \`/help\` - The most innovative help.`,
  fields: [
    {
      name: '**Games.**',
      value: `
\`/gunfight\` - For that good ol' fight bro.
\`/random\` - Return a random number.
\`/randomword\` - Returns a random word.
\`/choose\` - Choose between multiple options.
\`/reverse\` - Reverse a sentence.
\`/trivia\` - Start a trivia game on a topic of your choice.
\`/8ball\` - Random answers to random questions.
\`/repeat\` - Repeat a string.
\`/distort\` - Pretty distorted text.
\`/zalgo\` \`/dezalgo\` - The zalgo demon's writing.`.trimStart(),
    },
    {
      name: '**Random searches.**',
      value: `
\`/urban\` - Get an Urban Dictionary definition ;)
\`/define\` - Define a word in the Oxford Dictionary.
\`/cat\` and \`/dog\` - Random cats and dogs from <https://random.cat> and <https://dog.ceo>
\`/robohash\` - Take some text, make it a robot/monster/head/cat.
\`/namemc\` - A Minecraft user's previous usernames and skin.
\`/astronomy-picture-of-the-day\` or \`/apod\`
\`/currency\` - Currency conversion (\`/help currency\`)
\`/xkcd\` - Get the latest or a random xkcd comic.
\`/httpcat\` - Cats for HTTP status codes.
\`/google\` - Let me Google that for you.
\`/weather\` - It's really cloudy here..
\`/hastebin\` - Upload a file to hasteb.in to view on phone.
\`/ocr\` - Get text from an image.`.trimStart(),
    },
    {
      name: '**Utilities.**',
      // give/takerole are technically admin commands, but special cased because of public roles.
      value: `
TP \`/request\` - Request a specific feature.
\`/say\` | \`/type\` - Say something, even in another channel.
\`/editLastSay\` - Even if it was another channel.
\`/remindme\` | \`/reminderlist\` - Reminders.
\`/leave\` - Makes you leave the server.
\`/avatar\` - Avatar of a user.
\`/userinfo\` - User info.
\`/serverinfo\` - Server info 🤔
\`/creationtime\` - Find out creation time of something by Discord ID.
\`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
\`/emojiImage\` - Image of an emoji.
\`/giverole\` and \`/takerole\` - Edit roles.
\`/calculate\` - Calculate an expression.
\`/temperature\` - Convert between temperature units.
\`/suppressEmbed\` - Suppress or unsuppress embeds in a message.`.trimStart(),
    },
    {
      name: '**Administrative commands.**',
      value: `
\`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
\`/addEmoji\`, \`/deleteEmoji\` and \`/editEmoji\`
\`/deleteChannel\` and \`/editChannel\`
\`/warn\`, \`/warnings\`, \`/clearwarns\` and \`/removewarn\`
\`/changevoiceregion\` and \`/listvoiceregions\`
\`/perms\` - Displays a particular member's permissions.
\`/purge\` - Bulk delete a set of messages.
\`/slowmode\` - When you must slow down chat.
\`/notify\` - Ping a role that cannot be pinged.`.trimStart(),
    },
    {
      name: zeroWidthSpace,
      value: `**There are some easter egg auto responses.**
**Commands with TP are test pilot only.**`,
    },
  ],
}

const generateDocs = (command: Command): string => {
  let requirements = ''
  if (command.requirements) {
    const permissions = command.requirements.permissions
      ? `Needs the permissions: ${Object.keys(command.requirements.permissions)
          .map(formatPermissionName)
          .join(', ')} | `
      : ''
    const roleNames = command.requirements.roleNames
      ? `Needs the roles: ${command.requirements.roleNames.join(', ')} | `
      : ''
    const roleIDs = command.requirements.roleIDs ? 'Usable by users with a certain role | ' : ''
    const userIDs = command.requirements.userIDs ? 'Usable by certain users | ' : ''
    const custom = command.requirements.custom
      ? '\n**Requirements:** Has some unknown permission checks | '
      : ''
    requirements =
      custom ||
      (permissions || roleIDs || roleNames || userIDs
        ? `\n**Requirements:** ${custom}${permissions}${roleIDs}${roleNames}${userIDs}`
        : '')
  }

  if (command.aliases && command.aliases.length > 0) {
    return `
**Usage:** ${command.usage}
**Aliases:** ${command.aliases.map(i => '/' + i).join(', ')}
**Description:** ${command.fullDescription}
**Example:** ${command.example}${requirements.substring(0, requirements.length - 3)}
Arguments in () are optional :P
    `
  }
  return `
**Usage:** ${command.usage}
**Description:** ${command.fullDescription}
**Example:** ${command.example}${requirements.substring(0, requirements.length - 3)}
Arguments in () are optional :P
  `
}

const generator = async (
  author: string,
  command: string,
  client: Client,
  parser: CommandParser,
) => {
  const commands = parser.commands
  command = command.replace(/\//g, '').toLowerCase()
  const check = (commandObj: Command): boolean =>
    // First checks for name, 2nd for aliases.
    commandObj.name.toLowerCase() === command || !!commandObj.aliases?.includes(command)
  // Check if requested for a specific command.
  const foundCommand = Object.values(commands).find(check)
  if (foundCommand) {
    return generateDocs(foundCommand)
  } else if (command) {
    return { content: 'Incorrect parameters. Run /help for general help.', error: true }
  }
  // Default help.
  try {
    const channel = await client.getDMChannel(author)
    await channel.createMessage({
      content: `**IveBot's dashboard**: ${rootURL || 'https://ivebot.now.sh'}/
(Manage Server required to manage a server)`,
      embeds: [
        {
          color: 0x00ae86,
          // type: 'rich',
          title: 'Help',
          ...generalHelp,
          footer: { text: 'For help on a specific command or aliases, run /help <command>.' },
        },
      ],
    })
    return 'newbie, help has been direct messaged to you ✅'
  } catch {
    return { content: `I cannot DM you the help for newbies, you ${getInsult()} ❌`, error: true }
  }
}

export const handleHelp: SlashCommand<{ command?: string }> = {
  name: 'help',
  aliases: ['halp', 'hulp', 'gethelp', 'commands'],
  opts: {
    description: 'The most innovative help.',
    fullDescription: 'The most innovative halp.',
    usage: '/help (command name)',
    example: '/help zalgo',
    argsRequired: false,
    options: [
      {
        // TODO: Should this response be ephemeral?
        name: 'command',
        description: 'Name of the command to get help on.',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: false,
      },
    ],
  },
  slashGenerator: async ({ user }, { command }, { client, commandParser }) =>
    await generator(user.id, command ?? '', client, commandParser),
  generator: async (message, args, { client, commandParser }) =>
    await generator(message.author.id, args.join(' '), client, commandParser),
}
