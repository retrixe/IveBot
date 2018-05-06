import { getArguments } from '../imports/tools'
import { client } from '../imports/types'

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
    \`/link\` - Links your Discord to IveBot Web (use in DM only)
    \`/weather\` - It's really cloudy here..
    \`/say\` | \`/type\` - Say something, even in another channel.
    \`/editLastSay\` - Even if it was another channel.
    \`/avatar\` - Avatar of a user.
    \`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
    \`/giverole\` and \`/takerole\` - Edit roles.
**Administrative commands.**
    \`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
    \`/warn\` and \`/warnings\` | \`/clearwarns\` and \`/removewarn\`
    \`/purge\` - Bulk delete a set of messages.
    OP \`/edit\` - Edits any command sent by IveBot.

**There are some easter egg auto responses.**
**Commands with TP are test pilot only, ones with OP are only executable by the bot host.**`

const createHelpObject = (commandUsage: string, description: string, example: string, aliases?: string) => {
  return {
    commandUsage,
    aliases,
    description,
    example
  }
}
const b = createHelpObject // Short hand.
const generateDocs = (a: { commandUsage: string, description: string, example: string, aliases?: string }) => {
  if (a.aliases) {
    return `
**Usage:** ${a.commandUsage}
**Aliases:** ${a.aliases}
**Description:** ${a.description}
**Example:** ${a.example}
Arguments in () are optional :P
    `
  }
  return `
**Usage:** ${a.commandUsage}
**Description:** ${a.description}
**Example:** ${a.example}
Arguments in () are optional :P
  `
}

const commandDocs: { [index: string]: any } = {
  'help': b('/help (command name)', 'The most innovative halp.', '/help zalgo', '/halp'),
  'gunfight': b('/gunfight <user>', 'For that good ol\' fight bro.', '/gunfight @voldemort#6931', '/gfi'),
  'random': b('/random (starting number) (ending number)',
    'Returns a random number, by default between 0 and 10.', '/random 1 69', '/rand'),
  // 'randomword': b('/randomword', 'Returns a random word.', '/randomword', '/rw, /randw'),
  'choose': b('/choose <option 1>|(option 2)|(option 3)...', 'Choose between multiple options.',
    '/choose cake|ice cream|pasta', '/cho'),
  'reverse': b('/reverse <text>', 'Reverse a sentence.', '/reverse hello', '/rev'),
  '8ball': b('/8ball (question)', 'Random answers to random questions.', '/8ball Will I flunk my exam?'),
  'repeat': b('/repeat <number of times> <string to repeat>', 'Repeat a string.', '/repeat 10 a', '/rep'),
  'urban': b('/urban <term>', 'Get an Urban Dictionary definition ;)', '/urban nub', '/urb'),
  'cat': b('/cat', 'Random cat from <https://random.cat>', '/cat'),
  'dog': b('/dog (breed)', 'Random dog from <https://dog.ceo>', '/dog labrador'),
  'currency': b(
    '/currency <currency symbol to convert from> <currency symbol to convert to> (amount, default: 1)',
    'Convert a currency from one currency to another.', '/currency EUR USD 40', '/cur'
  ),
  'robohash': b('/robohash <cat/robot/monster/head> <text to hash>',
    'Takes some text and hashes it in the form of an image :P', '/robohash cat voldemort#6931', '/robo, /rh'),
  'zalgo': b('/zalgo <text>', 'The zalgo demon\'s handwriting.', '/zalgo sup', '/zgo'),
  'dezalgo': b('/dezalgo <text>', 'Read the zalgo demon\'s writing.', '/dezalgo ḥ̛̓e̖l̽͞҉lͦͅoͥ', '/dzgo'),
  'astronomy-picture-of-the-day': b(
    '/astronomy-picture-of-the-day (date)', 'The astronomy picture of the day. Truly beautiful. Usually.',
    '/astronomy-picture-of-the-day 2nd March 2017', '/apod'
  ),
  'apod': b('/apod (date)', 'The astronomy picture of the day. Truly beautiful. Usually.', '/apod 2nd March 2017', '/astronomy-picture-of-the-day'),
  'request': b('/request <something>', 'Request a feature. Only available to test pilots.', '/request a /userinfo command.', '/req'),
  'say': b('/say (channel) <text>', 'Say something. Test pilots and admins/mods only.', '/say #general heyo'),
  'type': b('/type (channel) <text>', 'Type something. Test pilots and admins/mods only.', '/type #general heyo'),
  'editLastSay': b('/editLastSay (channel) <new text>', 'Edits the last say in a channel.', '/editLastSay #general hey', '/els'),
  'edit': b('/edit (channel) <message ID> <new text>', 'Edits a single message. Owner only command.', '/edit #general 123456789012345678 hi'),
  'avatar': b('/avatar <user>', 'Avatar of a user.', '/avatar @voldemort#6931', '/av'),
  'about': b('/about', 'About IveBot.', '/about'),
  'ping': b('/ping', 'Latency of IveBot\'s connection to your server.', '/ping'),
  'uptime': b('/uptime', 'How long was IveBot on?', '/uptime'),
  'version': b('/version', 'Current running version of IveBot.', '/version'),
  'giverole': b('/giverole (user) <role>',
    'Give role to yourself/user. Manager/Mod only unless Public Roles are on.', '/giverole @voldemort#6931 Helper', '/gr'),
  'removerole': b('/removerole (user) <role>',
    'Remove role from yourself/user. Usually Manager/Mod only unless togglepublicroles is on.', '/takerole @voldemort#6931 Helper', '/tr'),
  'ban': b('/ban <user by ID/username/mention> (reason)', 'Ban someone.', '/ban voldemort you is suck', '/banana, /nuke'),
  'unban': b('/unban <user by ID/username/mention> (reason)', 'Unban someone.', '/unban voldemort wrong person'),
  'purge': b('/purge <number greater than 0>', 'Bulk delete messages newer than 2 weeks.', '/purge 10'),
  'kick': b('/kick <user by ID/username/mention> (reason)', 'Kick someone.', '/kick voldemort you is suck'),
  'warn': b('/warn <user by ID/username/mention> <reason>', 'Warn someone.', '/warn voldemort you is suck'),
  'warnings': b('/warnings <user by ID/username/mention>', 'Find out about a person\'s warnings.', '/warnings voldemort', '/warns'),
  'clearwarns': b('/clearwarns <user by ID/username/mention>', 'Clear all warnings a person has.', '/clearwarns voldemort', '/cw'),
  'removewarn': b(
    '/removewarn <user by ID/username/mention> <warning ID>',
    'Remove a single warnings from a person.', '/removewarn voldemort 5adf7a0e825aa7005a4e7be2', '/rw'
  ),
  'mute': b('/mute <user by ID/username/mention> (time limit) (reason)', 'Mute someone. Compatible with Dyno.', '/mute voldemort 1h bored'),
  'unmute': b('/unmute <user by ID/username/mention> (reason)', 'Unmute someone.', '/unmute voldemort wrong person'),
  'weather': b('/weather <city name>(,country name)', 'What\'s the weather like at your place?', '/weather Shanghai,CN', '/wt'),
  'token': b('/token', 'Links your Discord to IveBot Web (use in DM only, or your account may be hacked)', '/token'),
  'namemc': b('/namemc <premium Minecraft username>', 'Displays previous usernames and skins of a Minecraft player.', '/namemc voldemort', '/nmc'),
  'calculate': b('/calculate <expression>', 'Calculate the value of an expression.', '/calculate 2 + 2', '/calc')
}

export default function help (message: string, client: client, c: string, u: string) {
  if (getArguments(message).trim().split('/').join('') in commandDocs) {
    client.sendMessage({
      to: c, message: generateDocs(commandDocs[getArguments(message).trim().split('/').join('')])
    })
    return
  } else if (getArguments(message)) {
    client.sendMessage({
      to: c, message: 'Incorrect parameters. Run /help for general help.'
    })
    return
  }
  client.createDMChannel(u)
  client.sendMessage({
    embed: {
      color: 0x00AE86,
      type: 'rich',
      title: 'Help',
      description: generalHelp,
      footer: { text: 'For help on a specific command or aliases, run /help <command>.' }
    },
    to: u
  })
  client.sendMessage({ to: c, message: 'newbie, help has been direct messaged to you ✅' })
}
