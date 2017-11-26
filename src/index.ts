// Tokens and stuff.
import { Client } from 'discord.io'
import { token } from '../config.json'
import { handleGunfight, handleAccept, handleAnswers } from './gunfight'

// Create a client to connect to Discord API Gateway.
const client = new Client({
  token,
  autorun: true
})

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  client.sendMessage({ to: '361577668677861399', message: `True hacking is done in Swift u_u` })
})

// Disconnection from Discord will trigger the following.
client.on('disconnect', (errMsg, code) => console.log('Error:\n', errMsg, code))

// Create a database to handle certain stuff.
const db: {
  gunfight: Array<{
    challenged: string,
    challenger: string,
    accepted: boolean,
    randomWord: string
  }>
} = {
  gunfight: []
}

// When client recieves a message, it will callback.
client.on('message', async (user, userID, channelID, message, event) => {
  // Helper variables and functions.
  // Convert message to lowercase to ensure it works.
  const command = message.toLocaleLowerCase()
  // Mention the user with this variable.
  const mention = (() => {
    const user: any = client.servers[client.channels[channelID].guild_id].members[userID]
    if (user.nick === null) return `<@${userID}>`
    return `<@!${userID}>`
  })()
  // Helper command to send message to same channel.
  const sendResponse = (message: string) => client.sendMessage({ to: channelID, message })

  // Commands from on forth.
  // Help command.
  if (command.startsWith('/help') || command.startsWith('/halp')) {
    sendResponse(`
    **Jony Ive can do many commands.**
    The most innovative halp and help command.
    /gunfight - For that good ol' fight bro.
**There are some easter egg auto responses.**
    `)

    // Auto responses and easter eggs.
  } else if (command.startsWith('is dot a good boy')) sendResponse('Shame on you. He\'s undefined.')
  else if (command.startsWith('iphone x')) sendResponse(`You don't deserve it. 😎`)

  // Gunfight.
  else if (command.startsWith('/gunfight')) handleGunfight(command, mention, sendResponse, db)
  // Accept gunfight.
  else if (command.startsWith('/accept')) handleAccept(db, mention, sendResponse)
  // Handle answers to gunfight.
  else if (command in ['fire', 'water', 'gun', 'dot']) handleAnswers()
})
