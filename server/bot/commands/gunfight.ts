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
    const possibleGunfight = tempDB.gunfight.find((gunfight) => gunfight.challenged === user.id)
    if (possibleGunfight) return 'This user is already in a fight!'
    // Push to database.
    tempDB.gunfight.push({
      accepted: false,
      challenged: user.id,
      challenger: message.author.id,
      randomWord: '',
      channelID: message.channel.id
    })
    client.createMessage(
      message.channel.id, `${user.mention}, say /accept to accept the challenge.`
    )
    // The following will delete the gunfight if unaccepted within 30 seconds.
    setTimeout(async () => {
      // Find the gunfight we pushed.
      const gunfightPushed = tempDB.gunfight.find((gunfight) => gunfight.challenged === user.id)
      // Remove the object and send a response.
      if (!gunfightPushed.accepted) {
        const mention = message.author.mention
        client.createMessage(
          message.channel.id,
          `${mention}, your challenge to ${user.mention} has been cancelled.`
        )
      }
      tempDB.gunfight.splice(tempDB.gunfight.indexOf(gunfightPushed), 1)
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
    const gunfightToAccept = tempDB.gunfight.find((gunfight) => (
      gunfight.challenged === message.author.id && !gunfight.accepted &&
      message.channel.id === gunfight.channelID
    ))
    if (gunfightToAccept === undefined) return // Insert checks.
    // Accept only if person is not in another gunfight.
    if (tempDB.gunfight.find((gunfight) => (
      gunfight.challenged === message.author.id
    )) !== gunfightToAccept) {
      return 'You are already in a gunfight!'
    }
    // Accept the challenge.
    const indexOfGunfight = tempDB.gunfight.indexOf(gunfightToAccept)
    const words = ['fire', 'water', 'gun', 'dot']
    tempDB.gunfight[indexOfGunfight].accepted = true
    tempDB.gunfight[indexOfGunfight].randomWord = words[Math.floor(Math.random() * words.length)]
    client.createMessage(
      message.channel.id, `Within 20 seconds, you will be asked to say a random word.`
    )
    // Let's wait for random amount under 20s and call a random word.
    setTimeout(async () => {
      try {
        await message.channel.createMessage('Say ' + tempDB.gunfight[indexOfGunfight].randomWord + '!')
      } catch (e) {}
      /* TODO
      tempDB.gunfight[tempDB.gunfight.indexOf(gunfightToAccept)].wordSaid = true
      setTimeout(() => {
        if (tempDB.gunfight.find(
          i => i.challenged === message.author.id && message.channel.id === i.channelID
        )) {
          message.channel.createMessage('Neither of you said the word so you both lose..')
          tempDB.gunfight.splice(tempDB.gunfight.indexOf(gunfightToAccept), 1)
        }
      }, 30000) */
    }, Math.floor(Math.random() * 20000 + 1000))
  }
}
