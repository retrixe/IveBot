// Tokens and stuff.
import { Client } from 'discord.io'
import { token } from '../config.json'

// Create a client to connect to Discord API Gateway.
const client = new Client({
  token,
  autorun: true
})

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  client.sendMessage({ to: '361577668677861399', message: '' })
})

// Disconnection from Discord will trigger the following.
client.on('disconnect', (errMsg, code) => console.log('Error:\n', errMsg, code))

// Create a database to handle certain stuff.
const db: { gunfight: Array<{ challenged: string, challenger: string, accepted: boolean }> } = {
  gunfight: []
}

// When client recieves a message, it will callback.
client.on('message', async (user, userID, channelID, message, event) => {
  // Handling commands from on-forth.
  // Convert to lowercase to ensure it works.
  const command = message.toLocaleLowerCase()
  // Help command.
  if (command.startsWith('/help') || command.startsWith('/halp')) {
    client.sendMessage({
      to: channelID,
      message: `
    **Jony Ive can do many commands.**
    The most innovative halp and help command.
    /gunfight - For that good ol' fight bro.
**There are some easter egg auto responses.**
    `})
    // Auto response.
  } else if (command.startsWith('is dot a good boy')) {
    client.sendMessage({ to: channelID, message: `No, Dot Bot is better :>` })
    // Gunfight.
  } else if (command.startsWith('/gunfight')) {
    const challenged = command.split(' ')[1]
    console.log(challenged)
    db.gunfight.push({
      accepted: false,
      challenged,
      challenger: `<@${userID}>`
    })
    client.sendMessage({
      to: channelID,
      message: `${challenged}, say /accept to accept the challenge.`
    })
    // Accept gunfight.
  } else if (command.startsWith('/accept')) {
    const gunfightToAccept = db.gunfight.find(
      (gunfight) => gunfight.challenged === `<@!${userID}>`
    )
    if (gunfightToAccept === undefined) return
    client.sendMessage({ to: channelID, message: `You were challenged by ${gunfightToAccept.challenger}` })
  }
})
