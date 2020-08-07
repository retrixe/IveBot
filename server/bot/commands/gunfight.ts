// All the types!
import { Command } from '../imports/types'
// All the tools!
import { getUser } from '../imports/tools'

export const handleGunfight: Command = {
  name: 'gunfight',
  aliases: ['gfi'],
  opts: {
    description: 'For that good ol\' fight bro.',
    fullDescription: 'Challenge someone to a gunfight showdown.',
    usage: '/gunfight <user>',
    example: '/gunfight @voldemort#6931',
    guildOnly: true
  },
  generator: (message, args, { client, tempDB }) => {
    // Get challenged user.
    const user = getUser(message, args[0])
    // Confirm an argument was passed including one mention.
    if (!user) {
      return 'Specify a valid user to challenge >_>'
      // It should not be a challenge to self.
    } else if (user.id === message.author.id) return 'You cannot challenge yourself :P'
    // It should not be a challenge to bot itself.
    else if (user.id === client.user.id) {
      return 'Aw, how sweet. But I don\'t play with pathetic fools who try to fool me :>'
      // It should not be a challenge to a bot.
    } else if (user.bot) return 'Noob, that person is a bot.'

    // Do not challenge someone already in a gunfight.
    // Possible gunfights.
    const possibleGunfight = Object.keys(tempDB.gunfight)
      .find((gunfight) => gunfight.split('-').includes(user.id))
    if (possibleGunfight) return 'This user is already in a fight!'
    // Push to database.
    const timestamp = Date.now()
    tempDB.gunfight[message.author.id + '-' + user.id] = {
      timestamp,
      accepted: false,
      randomWord: '',
      channelID: message.channel.id,
      wordSaid: false
    }
    client.createMessage(
      message.channel.id, `${user.mention}, say /accept to accept the challenge.`
    )
    // The following will delete the gunfight if unaccepted within 30 seconds.
    setTimeout(async () => {
      // Find the gunfight we pushed.
      const gunfightPushed = tempDB.gunfight[message.author.id + '-' + user.id]
      // Remove the object and send a response.
      if (gunfightPushed && !gunfightPushed.accepted && gunfightPushed.timestamp === timestamp) {
        const mention = message.author.mention
        client.createMessage(
          message.channel.id,
          `${mention}, your challenge to ${user.mention} has been cancelled.`
        )
        delete tempDB.gunfight[message.author.id + '-' + user.id]
      }
    }, 30000)
  }
}

export const handleAccept: Command = {
  name: 'accept',
  opts: {
    description: 'For that good ol\' fight bro.',
    fullDescription: 'Accept a gunfight showdown.',
    usage: '/accept',
    example: '/accept',
    guildOnly: true,
    hidden: true,
    argsRequired: false
  },
  generator: (message, args, { client, tempDB }) => {
    // Find the gunfight, if exists.
    const gunfightToAccept = Object.keys(tempDB.gunfight).find((gunfight) => (
      gunfight.substr(gunfight.indexOf('-') + 1) === message.author.id &&
      !tempDB.gunfight[gunfight].accepted && message.channel.id === tempDB.gunfight[gunfight].channelID
    ))
    if (gunfightToAccept === undefined) return // Insert checks.
    // Accept only if person is not in another gunfight.
    if (Object.keys(tempDB.gunfight).filter((gunfight) => (
      gunfight.split('-').includes(message.author.id)
    )).length > 1) {
      return 'You are already in a gunfight!'
    }
    // Accept the challenge.
    const words = ['fire', 'water', 'gun', 'dot']
    tempDB.gunfight[gunfightToAccept].accepted = true
    tempDB.gunfight[gunfightToAccept].randomWord = words[Math.floor(Math.random() * words.length)]
    client.createMessage(
      message.channel.id, `Within 20 seconds, you will be asked to say a random word.`
    )
    const timestamp = tempDB.gunfight[gunfightToAccept].timestamp
    // Let's wait for random amount under 20s and call a random word.
    setTimeout(async () => {
      try {
        await message.channel.createMessage('Say ' + tempDB.gunfight[gunfightToAccept].randomWord + '!')
      } catch (e) {}
      tempDB.gunfight[gunfightToAccept].wordSaid = true
      setTimeout(() => {
        if (tempDB.gunfight[gunfightToAccept] &&
          tempDB.gunfight[gunfightToAccept].timestamp === timestamp &&
          tempDB.gunfight[gunfightToAccept].channelID === message.channel.id) {
          message.channel.createMessage('Neither of you said the word so you both lose..')
          delete tempDB.gunfight[gunfightToAccept]
        }
      }, 30000)
    }, Math.floor(Math.random() * 20000 + 1000))
  }
}
