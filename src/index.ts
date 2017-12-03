// Tokens and stuff.
import { Client } from 'discord.io'
import { token } from '../config.json'
// Commands.
import { handleRequest } from './commands/utilities'
import { handleChoose, handleReverse, handle8Ball, handleRepeat } from './commands/games'
import { handleGunfight, handleAccept } from './commands/gunfight'

// Create a client to connect to Discord API Gateway.
const client = new Client({
  token,
  autorun: true
})

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  client.sendMessage({ to: '361577668677861399', message: ``, typing: true })
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

// Test pilots.
const testPilots = [
  '305053306835697674', // voldemort#6931
  '295324726312566784', // Dot#8711
  '338924758173351937', // Astelon#7869
  '305280873476128768' // VR#5448
]

// When client recieves a message, it will callback.
client.on('message', (user, userID, channelID, message, event) => {
  // Helper variables and functions.
  // Convert message to lowercase to ensure it works.
  const command = message.toLocaleLowerCase()
  // Helper command to send message to same channel.
  const sendResponse = (message: string) => client.sendMessage({ to: channelID, message })

  // Commands from on forth.
  // Help command.
  if (command.startsWith('/help') || command.startsWith('/halp')) {
    sendResponse(`
    **Jony Ive can do many commands.**
    \`/halp\` and \`/help\` - The most innovative help.

**Games.**
    \`/gunfight\` - For that good ol' fight bro.
    \`/choose\` - Choose between multiple options.
    \`/reverse\` - Reverse a sentence.
    \`/8ball\` - Answers to questions.
    \`/repeat\` - Repeat a string.

**Commands available to test pilots.**
    \`/request\` - Request a specific feature.
**There are some easter egg auto responses.**
    `)

    // Auto responses and easter eggs.
  } else if (command.startsWith('is dot a good boy')) sendResponse('Shame on you. He\'s undefined.')
  else if (command.startsWith('iphone x')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('triggered')) sendResponse('Ah, pathetic people again.')
  else if (command.startsWith('ayy')) sendResponse('lmao')

  // Request something.
  else if (command.startsWith('/request') && testPilots.find((thing) => thing === userID)) handleRequest(client, userID, sendResponse, message)
  // Gunfight.
  else if (command.startsWith('/gunfight')) handleGunfight(command, userID, sendResponse, db)
  // Accept gunfight.
  else if (command.startsWith('/accept')) handleAccept(db, userID, sendResponse)
  // Handle answers to gunfight.
  // else if (command in ['fire', 'water', 'gun', 'dot']) return
  // Choose.
  else if (command.startsWith('/choose')) handleChoose(message, sendResponse)
  // Reverse.
  else if (command.startsWith('/reverse')) handleReverse(message, sendResponse)
  // 8ball.
  else if (command.startsWith('/8ball')) handle8Ball(message, sendResponse)
  // 8ball.
  else if (command.startsWith('/repeat')) handleRepeat(message, sendResponse)
})
