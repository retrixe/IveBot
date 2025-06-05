// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import { getUser } from '../../imports/tools.ts'

export const handleGunfight: Command = {
  name: 'gunfight',
  aliases: ['gfi'],
  opts: {
    description: "For that good ol' fight bro.",
    fullDescription: 'Challenge someone to a gunfight showdown.',
    usage: '/gunfight <user>',
    example: '/gunfight @voldemort#6931',
    guildOnly: true,
  },
  generator: (message, args, { client, tempDB }) => {
    // Get challenged user.
    const user = getUser(message, args[0])
    // Confirm an argument was passed including one mention.
    if (!user) {
      return { content: 'Specify a valid user to challenge >_>', error: true }
      // It should not be a challenge to self.
    } else if (user.id === message.author.id)
      return { content: 'You cannot challenge yourself :P', error: true }
    // It should not be a challenge to bot itself.
    else if (user.id === client.user.id) {
      return {
        content: "Aw, how sweet. But I don't play with pathetic fools who try to fool me :>",
        error: true,
      }
      // It should not be a challenge to a bot.
    } else if (user.bot) return { content: 'Noob, that person is a bot.', error: true }

    // Do not challenge someone already in a gunfight.
    // Possible gunfights.
    const possibleGunfight = Object.keys(tempDB.gunfight).find(gunfight =>
      gunfight.split('-').includes(user.id),
    )
    if (possibleGunfight) return { content: 'This user is already in a fight!', error: true }
    // Push to database.
    const timestamp = Date.now()
    tempDB.gunfight[message.author.id + '-' + user.id] = {
      timestamp,
      accepted: false,
      randomWord: '',
      channelID: message.channel.id,
      wordSaid: false,
    }
    // The following will delete the gunfight if unaccepted within 30 seconds.
    setTimeout(() => {
      // Find the gunfight we pushed.
      const gunfightPushed = tempDB.gunfight[message.author.id + '-' + user.id]
      // Remove the object and send a response.
      if (gunfightPushed && !gunfightPushed.accepted && gunfightPushed.timestamp === timestamp) {
        const mention = message.author.mention
        message.channel
          .createMessage(`${mention}, your challenge to ${user.mention} has been cancelled.`)
          .then(() => {
            delete tempDB.gunfight[message.author.id + '-' + user.id]
          })
          .catch(() => {
            delete tempDB.gunfight[message.author.id + '-' + user.id]
          })
      }
    }, 30000)
    return `${user.mention}, say /accept to accept the challenge.`
  },
}

export const handleAccept: Command = {
  name: 'accept',
  opts: {
    description: "For that good ol' fight bro.",
    fullDescription: 'Accept a gunfight showdown.',
    usage: '/accept',
    example: '/accept',
    guildOnly: true,
    hidden: true,
    argsRequired: false,
  },
  generator: (message, args, { client, tempDB }) => {
    // Find the gunfight, if exists.
    const gunfightToAccept = Object.keys(tempDB.gunfight).find(
      gunfight =>
        gunfight.substr(gunfight.indexOf('-') + 1) === message.author.id &&
        !tempDB.gunfight[gunfight].accepted &&
        message.channel.id === tempDB.gunfight[gunfight].channelID,
    )
    if (gunfightToAccept === undefined) return // Insert checks.
    // Accept only if person is not in another gunfight.
    if (
      Object.keys(tempDB.gunfight).filter(gunfight =>
        gunfight.split('-').includes(message.author.id),
      ).length > 1
    ) {
      return { content: 'You are already in a gunfight!', error: true }
    }
    // Accept the challenge.
    const words = ['fire', 'water', 'gun', 'dot']
    tempDB.gunfight[gunfightToAccept].accepted = true
    tempDB.gunfight[gunfightToAccept].randomWord = words[Math.floor(Math.random() * words.length)]
    const timestamp = tempDB.gunfight[gunfightToAccept].timestamp
    // Let's wait for random amount under 20s and call a random word.
    const interval = Math.floor(Math.random() * 20000 + 1000)
    setTimeout(() => {
      message.channel
        .createMessage('Say ' + tempDB.gunfight[gunfightToAccept].randomWord + '!')
        .then(() => {
          tempDB.gunfight[gunfightToAccept].wordSaid = true
          setTimeout(() => {
            if (
              tempDB.gunfight[gunfightToAccept] &&
              tempDB.gunfight[gunfightToAccept].timestamp === timestamp &&
              tempDB.gunfight[gunfightToAccept].channelID === message.channel.id
            ) {
              message.channel
                .createMessage('Neither of you said the word so you both lose..')
                .then(() => {
                  delete tempDB.gunfight[gunfightToAccept]
                })
                .catch(() => {
                  delete tempDB.gunfight[gunfightToAccept]
                })
            }
          }, 30000)
        })
        .catch(() => {
          delete tempDB.gunfight[gunfightToAccept]
        })
    }, interval)
    return 'Within 20 seconds, you will be asked to say a random word.'
  },
}
