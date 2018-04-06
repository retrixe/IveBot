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
**Random searches.**
    \`/urban\` - Get an Urban Dictionary definition ;)
    \`/cat\` and \`/dog\` - Random cats and dogs from <https://random.cat> and <https://dog.ceo>
    \`/robohash\` - Take some text, make it a robot/monster/head/cat.
    \`/zalgo\` \`/dezalgo\` - The zalgo demon's writing.
    \`/astronomy-picture-of-the-day\` or \`/apod\`
**Utilities.**
    TP \`/request\` - Request a specific feature.
    \`/say\` - Say something, even in another channel.
    \`/editLastSay\` - Even if it was another channel.
    \`/avatar\` - Avatar of a user.
    \`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
    \`/addrole\` and \`/removerole\`
**Administrative commands.**
    \`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
    \`/togglepublicroles\` - Enable public roles.
**Music.**
    \`/join\` - Join the channel.

**There are some easter egg auto responses.**
**Commands with TP are test pilot only.**`

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
  'editLastSay': b('/editLastSay (channel) <new text>', 'Edits the last say in a channel.', '/editLastSay #general hey', '/els'),
  'avatar': b('/avatar <user>', 'Avatar of a user.', '/avatar @voldemort#6931', '/av'),
  'about': b('/about', 'About IveBot.', '/about'),
  'ping': b('/ping', 'Latency of IveBot\'s connection to your server.', '/ping'),
  'uptime': b('/uptime', 'How long was IveBot on?', '/uptime'),
  'version': b('/version', 'Current running version of IveBot.', '/version'),
  'addrole': b('/addrole (user) <role>',
    'Add role to yourself/user. Usually Manager/Mod only unless togglepublicroles is on.', '/addrole @voldemort#6931 Helper', '/ar'),
  'removerole': b('/removerole (user) <role>',
    'Remove role from yourself/user. Usually Manager/Mod only unless togglepublicroles is on.', '/removerole @voldemort#6931 Helper', '/rr'),
  'ban': b('/ban <user by ID/username/mention> (reason)', 'Ban someone.', '/ban voldemort you is suck', '/banana'),
  'unban': b('/unban <user by ID/username/mention> (reason)', 'Unban someone.', '/unban voldemort wrong person'),
  'kick': b('/kick <user by ID/username/mention> (reason)', 'Kick someone.', '/kick voldemort you is suck'),
  'mute': b('/mute <user by ID/username/mention> (time limit) (reason)', 'Mute someone. Compatible with Dyno.', '/mute voldemort 1h bored'),
  'unmute': b('/unmute <user by ID/username/mention> (reason)', 'Unmute someone.', '/unmute voldemort wrong person'),
  'togglepublicroles': b('/togglepublicroles (on/off)',
    'Enable public roles, which let members add roles to themselves. Roles lower than their highest role of course.',
    '/togglepublicroles on'
  ),
  'join': b('/join', 'Join your voice channel.', '/join')
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
