// Tokens and stuff.
import 'json5/lib/require'
import { testPilots } from '../config.json5'
import { version } from '../package.json'
import * as ms from 'ms'
import { execSync } from 'child_process'
// Commands.
import { handleRequest, handleSay, handleEditLastSay, handleAvatar } from './commands/utilities'
import {
  handleChoose,
  handleReverse,
  handle8Ball,
  handleRepeat, handleRandom,
  handleZalgo, handleDezalgo
} from './commands/games'
import {
  handleUrban, handleCat, handleDog, handleRobohash, handleApod
} from './commands/api'
import { handleGunfight, handleAccept } from './commands/gunfight'
import {
  handleKick, handleBan, handleUnban, handleMute, handleUnmute, handleWarn,
  handleAddrole, handleRemoverole,
  handleTogglepublicroles
} from './commands/admin'
import { handleJoin } from './commands/music'

// We need types.
import { client, event, DB } from './imports/types'
import { getArguments, getServerSettings } from './imports/tools'
import help from './commands/help'

// When client recieves a message, it will callback.
export default (client: client, tempDB: DB, onlineSince: number) => async (
  user: string,
  userID: string,
  channelID: string,
  message: string,
  event: event
) => {
  // Disable bots from responding.
  if (client.users[userID].bot) return
  // Helper variables and functions.
  // Convert message to lowercase to ensure it works.
  const command = message.toLocaleLowerCase()
  // Helper command to send message to same channel.
  const sendResponse = (m: string|Buffer, cb?: (error: {}, response: { id: string }) => void) => client.sendMessage({
    to: channelID, message: m
  }, cb)
  // Is the person a test pilot.
  const testPilot: string = testPilots.find((user: string) => user === userID)

  // Commands from on forth.
  // This object represents all commands that accept only (message, sendResponse) as args.
  const commandMaps: {[index: string]: Function} = {
    // Choose.
    '/choose': handleChoose,
    '/cho': handleChoose,
    // Random.
    '/random': handleRandom,
    '/rand': handleRandom,
    // Reverse.
    '/reverse': handleReverse,
    '/rev': handleReverse,
    // 8ball.
    '/8ball': handle8Ball,
    // Repeat.
    '/repeat': handleRepeat,
    '/rep': handleRepeat,
    // Urban.
    '/urban': handleUrban,
    '/urb': handleUrban,
    // Cat.
    '/cat': handleCat,
    // Dog.
    '/dog': handleDog,
    // Zalgo.
    '/zalgo': handleZalgo,
    '/zgo': handleZalgo,
    // Dezalgo.
    '/dezalgo': handleDezalgo,
    '/dzgo': handleDezalgo,
    // Robohash.
    '/robohash': handleRobohash,
    '/robo': handleRobohash,
    '/rh': handleRobohash,
    // Astronomy picture of the day.
    '/astronomy-picture-of-the-day': handleApod,
    '/apod': handleApod
  }
  // Check for the above commands.
  for (let i = 0; i < Object.keys(commandMaps).length; i++) {
    if (command.startsWith(Object.keys(commandMaps)[i])) commandMaps[Object.keys(commandMaps)[i]](message, sendResponse)
  }
  // Help command.
  if (command.startsWith('/help') || command.startsWith('/halp')) help(message, client, channelID, userID)
  // Auto responses and easter eggs.
  else if (command.startsWith('is dot a good boy')) sendResponse('Shame on you. He\'s undefined.')
  else if (command.startsWith('iphone x')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('triggered')) sendResponse('Ah, pathetic people again.')
  else if (command.startsWith('ayy')) sendResponse('lmao')
  else if (command.startsWith('shawarma')) sendResponse('http://www.recipetineats.com/wp-content/uploads/2014/12/Chicken-Shawarma_4.jpg')
  // Request something.
  else if ((command.startsWith('/request') || command.startsWith('/req')) && testPilot) handleRequest(client, userID, sendResponse, message)
  // Gunfight.
  else if (command.startsWith('/gunfight') || command.startsWith('/gfi')) handleGunfight(command, userID, sendResponse, tempDB, channelID)
  // Accept gunfight.
  else if (command.startsWith('/accept')) handleAccept(tempDB, userID, sendResponse, channelID)
  // Handle answers to gunfight.
  // else if (command in ['fire', 'water', 'gun', 'dot']) return
  // Say.
  else if (command.startsWith('/say')) handleSay(message, sendResponse, client, event, testPilot, tempDB)
  // Edit last say.
  else if (
    command.startsWith('/editLastSay') || command.startsWith('/els')
  ) handleEditLastSay(message, sendResponse, client, event, testPilot, tempDB)
  // Avatar.
  else if (command.startsWith('/avatar') || command.startsWith('/av')) handleAvatar(message, sendResponse, client)
  // Ban.
  else if (command.startsWith('/ban')) handleBan(client, event, sendResponse, message)
  // Unban.
  else if (command.startsWith('/unban')) handleUnban(client, event, sendResponse, message)
  // Kick.
  else if (command.startsWith('/kick')) handleKick(client, event, sendResponse, message)
  // Mute.
  else if (command.startsWith('/mute')) handleMute(client, event, sendResponse, message)
  // Unmute.
  else if (command.startsWith('/unmute')) handleUnmute(client, event, sendResponse, message)
  // Warn.
  else if (command.startsWith('/warn')) handleWarn(client, event, sendResponse, message)
  // Music.
  else if (command.startsWith('/join')) handleJoin(sendResponse, client, userID, channelID)
  // Version and about.
  else if (command.startsWith('/version')) sendResponse(`**IveBot ${version}**`)
  else if (command.startsWith('/about')) {
    sendResponse(`**IveBot ${version}**
IveBot is a Discord bot written with discord.io and care.
Unlike most other dumb bots, IveBot was not written with discord.js and has 0% copied code.
Built with community feedback mainly, IveBot does a lot of random stuff and fun.
IveBot 2.0 is planned to be built complete with music, administrative commands and a web dashboard.
For information on what IveBot can do, type **/help** or **/halp**.
The source code can be found here: <https://github.com/retrixe/IveBot>
For noobs, this bot is licensed and protected by law. Copy code and I will sue you for a KitKat.`)
  } else if (command.startsWith('/ping')) {
    // Get current time.
    const startTime = new Date().getTime()
    // Then send a message.
    sendResponse('Ping?', (err, { id }) => {
      // Latency (unrealistic, this can be negative or positive)
      const fl = startTime - new Date().getTime()
      // Divide latency by 2 to get more realistic latency and get absolute value (positive)
      const l = Math.abs(fl) / 2
      // Get latency.
      const e = l < 200 ? `latency of **${l}ms** 🚅🔃` : `latency of **${l}ms** 🔃`
      if (err) sendResponse('IveBot has experienced an internal error.')
      client.editMessage({
        channelID,
        messageID: id,
        message: `Aha! IveBot ${version} is connected to your server with a ${e}`
      })
    })
  } else if (command.startsWith('/uptime')) sendResponse(ms(Math.abs(new Date().getTime()) - onlineSince, { long: true }))
  else if (command.startsWith('/remoteexec') && userID === '305053306835697674') sendResponse(execSync(getArguments(message), { encoding: 'utf8' }))
  // Certain commands rely on server settings. I hope we can await for them.
  // Add role.
  else if (command.startsWith('/addrole') || command.startsWith('/ar')) {
    const serverSettings = await getServerSettings(client.channels[event.d.channel_id].guild_id)
    handleAddrole(client, event, sendResponse, message, serverSettings)
    // Remove role.
  } else if (command.startsWith('/removerole') || command.startsWith('/rr')) {
    const serverSettings = await getServerSettings(client.channels[event.d.channel_id].guild_id)
    handleRemoverole(client, event, sendResponse, message, serverSettings)
    // Toggle public role system.
  } else if (command.startsWith('/togglepublicroles')) {
    const serverSettings = await getServerSettings(client.channels[event.d.channel_id].guild_id)
    handleTogglepublicroles(client, event, sendResponse, message, serverSettings)
  }
}
