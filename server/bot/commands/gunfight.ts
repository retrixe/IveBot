// All the types!
import { Command } from '../imports/types'
// All the tools!
import { getIdFromMention } from '../imports/tools'

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
  generator: (client, db) => (message, args) => {
    // Get challenged mention and ID.
    const challengedID = getIdFromMention(args[0])
    // Confirm an argument was passed including one mention.
    if (args.length === 0 || message.mentions.length === 0) {
      return 'Please specify a user to challenge >_>'
      // The first argument should be a mention.
    } else if (message.mentions[0].id !== challengedID) {
      return 'Specify a valid user to challenge >_>'
      // It should not be a challenge to self.
    } else if (challengedID === message.author.id) return 'You cannot challenge yourself :P'
    // It should not be a challenge to bot itself.
    else if (challengedID === client.user.id) {
      return 'Aw, how sweet. But I don\'t play with pathetic fools who try to fool me :>'
      // It should not be a challenge to a bot.
    } else if (message.mentions[0].bot) return 'Noob, that person is a bot.'

    // Do not challenge someone already in a gunfight.
    // Possible gunfights.
    const possibleGunfight = db.gunfight.find((gunfight) => gunfight.challenged === challengedID)
    if (possibleGunfight) return 'This user is already in a fight!'
    // Push to database.
    db.gunfight.push({
      accepted: false,
      challenged: challengedID,
      challenger: message.author.id,
      randomWord: '',
      channelID: message.channel.id
    })
    client.createMessage(
      message.channel.id, `${message.mentions[0].mention}, say /accept to accept the challenge.`
    )
    // The following will delete the gunfight if unaccepted within 30 seconds.
    setTimeout(() => {
      // Find the gunfight we pushed.
      const gunfightPushed = db.gunfight.find((gunfight) => gunfight.challenged === challengedID)
      // Remove the object and send a response.
      if (!gunfightPushed.accepted) {
        const mention = message.author.mention
        client.createMessage(
          message.channel.id,
          `${mention}, your challenge to ${message.mentions[0].mention} has been cancelled.`
        )
      }
      db.gunfight.splice(db.gunfight.indexOf(gunfightPushed), 1)
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
  generator: (client, db) => (message) => {
    // Find the gunfight, if exists.
    const gunfightToAccept = db.gunfight.find((gunfight) => (
      gunfight.challenged === message.author.id && !gunfight.accepted
    ))
    if (gunfightToAccept === undefined) return // Insert checks.
    // Accept in same channelID.
    if (gunfightToAccept.channelID !== message.channel.id) {
      return 'Please accept any challenges in the same channel.'
    }
    // Accept only if person is not in another gunfight.
    if (db.gunfight.find((gunfight) => (
      gunfight.challenged === message.author.id
    )) !== gunfightToAccept) {
      return 'You are already in a gunfight!'
    }
    // Accept the challenge.
    const indexOfGunfight = db.gunfight.indexOf(gunfightToAccept)
    const words = ['fire', 'water', 'gun', 'dot']
    db.gunfight[indexOfGunfight].accepted = true
    db.gunfight[indexOfGunfight].randomWord = words[Math.floor(Math.random() * words.length)]
    client.createMessage(
      message.channel.id, `Within 20 seconds, you will be asked to say a random word.`
    )
    // Let's wait for random amount under 20s and call a random word.
    setTimeout(
      () => client.createMessage(
        message.channel.id, 'Say `' + db.gunfight[indexOfGunfight].randomWord + '`!'
      ),
      Math.floor(Math.random() * 20000 + 1000)
    )
  }
}
