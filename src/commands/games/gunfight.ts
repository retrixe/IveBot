// All the types!
import type { Message } from '@projectdysnomia/dysnomia'
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
    const possibleGunfight = tempDB.gunfight
      .keys()
      .find(gunfight => gunfight.split('-').includes(user.id))
    if (possibleGunfight) return { content: 'This user is already in a fight!', error: true }
    // Push to database.
    const timestamp = Date.now()
    const gunfightID = message.author.id + '-' + user.id
    tempDB.gunfight.set(gunfightID, {
      timestamp,
      accepted: false,
      randomWord: '',
      channelID: message.channel.id,
      wordSaid: false,
    })
    // The following will delete the gunfight if unaccepted within 30 seconds.
    setTimeout(() => {
      // Find the gunfight we pushed.
      const gunfightPushed = tempDB.gunfight.get(gunfightID)
      // Remove the object and send a response.
      if (gunfightPushed && !gunfightPushed.accepted && gunfightPushed.timestamp === timestamp) {
        const mention = message.author.mention
        message.channel
          .createMessage(`${mention}, your challenge to ${user.mention} has been cancelled.`)
          .then(() => tempDB.gunfight.delete(gunfightID))
          .catch(() => tempDB.gunfight.delete(gunfightID))
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
  generator: (message, args, { tempDB }) => {
    // Find the gunfight, if exists.
    const gunfightToAccept = tempDB.gunfight
      .entries()
      .find(
        ([gunfightID, data]) =>
          gunfightID.substring(gunfightID.indexOf('-') + 1) === message.author.id &&
          !data.accepted &&
          message.channel.id === data.channelID,
      )
    if (gunfightToAccept === undefined) return // Insert checks.
    // Accept only if person is not in another gunfight.
    if (
      tempDB.gunfight
        .entries()
        .filter(([id, data]) => id.split('-').includes(message.author.id) && data.accepted)
        .reduce(acc => acc + 1, 0) > 0
    ) {
      return { content: 'You are already in a gunfight!', error: true }
    }
    // Accept the challenge.
    const words = ['fire', 'water', 'gun', 'dot']
    gunfightToAccept[1].accepted = true
    gunfightToAccept[1].randomWord = words[Math.floor(Math.random() * words.length)]
    const timestamp = gunfightToAccept[1].timestamp
    // Let's wait for random amount under 20s and call a random word.
    const interval = Math.floor(Math.random() * 20000 + 1000)
    setTimeout(() => {
      message.channel
        .createMessage('Say ' + gunfightToAccept[1].randomWord + '!')
        .then(() => {
          gunfightToAccept[1].wordSaid = true
          return new Promise(resolve => setTimeout(resolve, 30000)) // Wait 30 seconds...
        })
        .then((): Promise<Message> => {
          const gunfight = tempDB.gunfight.get(gunfightToAccept[0])
          if (gunfight?.timestamp === timestamp && gunfight.channelID === message.channel.id) {
            return message.channel.createMessage('Neither of you said the word so you both lose..')
          } else return
        })
        .then(() => tempDB.gunfight.delete(gunfightToAccept[0]))
        .catch(() => tempDB.gunfight.delete(gunfightToAccept[0]))
    }, interval)
    return 'Within 20 seconds, you will be asked to say a random word.'
  },
}
