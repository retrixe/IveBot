import { getArguments } from '../imports/tools'
import { client } from '../imports/types'

let a = `   ** Jony Ive can do many commands 📡**
\`/halp\` and \`/help\` - The most innovative help.
**Games.**
    \`/gunfight\` - For that good ol' fight bro.
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
    \`/avatar\` - Avatar of a user.
    \`/about\`, \`/ping\`, \`/uptime\` and \`/version\` - About the running instance of IveBot.
    \`/addrole\` and \`/removerole\`
    AD \`/ban\`, \`/unban\`, \`/kick\`, \`/mute\` and \`/unmute\`
    AD \`/togglepublicroles\` - Enable public roles.

**There are some easter egg auto responses.**
**Commands with TP are test pilot only.**
**Commands with AD are admin/helper only.**`

export default function help (message: string, client: client, c: string, u: string) {
  if (getArguments(message).trim() === '') {
    client.createDMChannel(u)
    client.sendMessage({
      embed: {
        color: 0x00AE86,
        type: 'rich',
        title: 'Help',
        description: a,
        footer: { text: 'For help on a specific command, run /help <command>.' }
      },
      to: u
    })
    client.sendMessage({ to: c, message: 'nob, help has been direct messaged to you ✅' })
  }
}
